import React, { useState, useEffect } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import { useGlobalControls } from '../../hooks/useGlobalControls';
import { useRouter } from 'next/router';
import CharacterPreview from './CharacterPreview';

interface StoreItem {
  name: string;
  path: string;
}

export default function Store() {
  const router = useRouter();
  const { selectedCharacter, updateCharacterAttributes } = useCharacter();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Tab data
  const storeTabs = ['eye_accessories', 'body', 'prop', 'hats', 'tops', 'bottoms'];
  const [tabIndex, setTabIndex] = useState(0);
  const [activeTab, setActiveTab] = useState(storeTabs[0]);

  // Store items
  const [items, setItems] = useState<{ [key: string]: StoreItem[] }>({
    eye_accessories: [],
    body: [],
    prop: [],
    hats: [],
    tops: [],
    bottoms: [],
  });

  // Pagination
  const itemsPerPage = 9;
  const [currentPage, setCurrentPage] = useState(1);

  // Pane focus: "tabs" or "items"
  const [paneFocus, setPaneFocus] = useState<'tabs' | 'items'>('tabs');
  // Within "items" pane, track which item index is selected
  // The last 2 indexes represent "Prev" and "Next" in pagination
  const [itemsFocusIndex, setItemsFocusIndex] = useState(0);

  useEffect(() => {
    setActiveTab(storeTabs[tabIndex]);
    setCurrentPage(1);
    setItemsFocusIndex(0);
  }, [tabIndex]);

  // Fetch store outfits
  useEffect(() => {
    if (!selectedCharacter) return;
    const { contract } = selectedCharacter;
    if (!contract) return;

    fetch(`/api/store/outfits?contract=${contract}`)
      .then((response) => response.json())
      .then((data) => {
        setItems({
          eye_accessories: data.head || [],
          body: data.body || [],
          prop: data.prop || [],
          hats: data.hats || [],
          tops: data.tops || [],
          bottoms: data.bottoms || [],
        });
      })
      .catch((error) => {
        console.error('Error fetching store items:', error);
        setErrorMessage('Failed to fetch store items.');
      });
  }, [selectedCharacter]);

  function normalizeTraitType(traitType: string) {
    return traitType.replace(/\s+/g, '_').toLowerCase();
  }

  // Equip logic
  function handleItemClick(category: string, itemName: string) {
    try {
      if (!selectedCharacter?.attributes) {
        setErrorMessage('Selected character or attributes are missing.');
        return;
      }
      const newValue = itemName.replace(/\s+/g, '_').toLowerCase();
      const normalizedCategory = normalizeTraitType(category);
      let updatedAttributes = [...selectedCharacter.attributes];

      // Check for onesie logic
      const bodyTrait = updatedAttributes.find((attr) => normalizeTraitType(attr.trait_type) === 'body');
      const isOnesieEquipped =
        bodyTrait?.value &&
        typeof bodyTrait.value === 'string' &&
        bodyTrait.value.endsWith('_onesie');

      // If equipping top/bottom, remove onesie
      if (normalizedCategory === 'tops' || normalizedCategory === 'bottoms') {
        if (isOnesieEquipped) {
          updatedAttributes = updatedAttributes.map((attr) => {
            const type = normalizeTraitType(attr.trait_type);
            if (type === 'body') {
              return { ...attr, value: 'none' };
            }
            if (type === 'head') {
              const baseVal = (attr.original_value || attr.value) as string;
              return { ...attr, value: baseVal.replace('_onesie', '').toLowerCase() };
            }
            return attr;
          });
        }
      } else if (normalizedCategory === 'body') {
        // If equipping a onesie, remove top, bottom, hats
        const isNewItemOnesie = newValue.endsWith('_onesie');
        if (isNewItemOnesie) {
          updatedAttributes = updatedAttributes.map((attr) => {
            const type = normalizeTraitType(attr.trait_type);
            if (type === 'tops' || type === 'bottoms' || type === 'hats') {
              return { ...attr, value: 'none' };
            }
            if (type === 'head') {
              const baseVal = (attr.original_value || attr.value) as string;
              return { ...attr, value: `${baseVal.replace('_onesie','')}_onesie`.toLowerCase() };
            }
            return attr;
          });
        }
      } else if (normalizedCategory === 'hats' && isOnesieEquipped) {
        console.error('Cannot equip hats while wearing a onesie!');
        return;
      }

      // Apply the new equipment piece
      updatedAttributes = updatedAttributes.map((attr) => {
        if (normalizeTraitType(attr.trait_type) === normalizedCategory) {
          return { ...attr, value: newValue };
        }
        return attr;
      });

      // Deduplicate
      const uniqueUpdatedAttributes = updatedAttributes.filter(
        (attr, index, self) => index === self.findIndex((t) => t.trait_type === attr.trait_type),
      );

      updateCharacterAttributes(uniqueUpdatedAttributes);
    } catch (error) {
      console.error('Error equipping item:', error);
      setErrorMessage('Error equipping item.');
    }
  }

  function getAllItems() {
    return items[activeTab] || [];
  }

  function getDisplayedItems() {
    const all = getAllItems();
    const startIndex = (currentPage - 1) * itemsPerPage;
    return all.slice(startIndex, startIndex + itemsPerPage);
  }

  const displayedItems = getDisplayedItems();
  const totalPages = Math.ceil(getAllItems().length / itemsPerPage);

  function handlePrevPage() {
    if (totalPages < 1) return;
    setCurrentPage((prev) => (prev > 1 ? prev - 1 : totalPages));
    setItemsFocusIndex(0);
  }

  function handleNextPage() {
    if (totalPages < 1) return;
    setCurrentPage((prev) => (prev < totalPages ? prev + 1 : 1));
    setItemsFocusIndex(0);
  }

  // Hook for WASD/arrow key input
  useGlobalControls({
    onUp: () => {
      if (paneFocus === 'tabs') {
        // move tabIndex up
        setTabIndex((prev) => (prev - 1 + storeTabs.length) % storeTabs.length);
      } else {
        // items
        setItemsFocusIndex((prev) => Math.max(0, prev - 1));
      }
    },
    onDown: () => {
      if (paneFocus === 'tabs') {
        // move tabIndex down
        setTabIndex((prev) => (prev + 1) % storeTabs.length);
      } else {
        // items
        const lastIndex = displayedItems.length + 1; // +2 for pagination, zero-based => +1 for last
        setItemsFocusIndex((prev) => Math.min(lastIndex, prev + 1));
      }
    },
    onLeft: () => {},
    onRight: () => {},
    onAction: () => {
      // Enter or Space
      if (paneFocus === 'tabs') {
        // Switch to items focus
        setPaneFocus('items');
        setItemsFocusIndex(0);
      } else {
        // We are in items
        if (itemsFocusIndex < displayedItems.length) {
          const item = displayedItems[itemsFocusIndex];
          if (item?.name) {
            // Equip item upon action
            handleItemClick(activeTab, item.name);
          }
        } else {
          // pagination
          const isPrev = (itemsFocusIndex === displayedItems.length);
          if (isPrev) {
            handlePrevPage();
          } else {
            handleNextPage();
          }
        }
      }
    },
    onSecondary: () => {
      // "q" or "e" => user goes back to tabs
      if (paneFocus === 'items') {
        setPaneFocus('tabs');
      }
    },
    onEscape: () => {
      router.push('/');
    },
  });

  return (
    <div className="flex flex-col w-full h-full bg-[#697c01]">

      {/* TOP BAR: Character Preview */}
      <div className="border-b-4 border-[#333d02] px-8 py-6 flex justify-center">
        <div className="w-[75%] max-w-[850px] border-4 border-[#333d02] bg-[#333d02]/10 p-4">
          <CharacterPreview />
        </div>
      </div>

      {/* BOTTOM: Store UI */}
      <div className="flex-1 flex flex-col items-center p-6 overflow-y-auto">
        <h2 className="text-center text-4xl font-bold uppercase text-[#333d02] mb-6 font-[MekMono]">
          Store
        </h2>

        {errorMessage && (
          <div className="bg-red-400 text-white p-2 rounded my-2">
            {errorMessage}
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-row space-x-6 mb-6">
          {storeTabs.map((tab, idx) => {
            const isFocusedTab = (paneFocus === 'tabs' && tabIndex === idx);
            const isActiveTab = (activeTab === tab);
            return (
              <div
                key={tab}
                className={`
                  uppercase border-4 px-4 py-2 text-xl cursor-pointer 
                  font-[MekMono] text-[#333d02]
                  ${isActiveTab ? 'bg-white/5' : 'bg-transparent'}
                  ${isFocusedTab ? 'border-yellow-400 blinking-border' : 'border-[#333d02]'}
                `}
              >
                {tab.replace(/_/g, ' ')}
              </div>
            );
          })}
        </div>

        {/* Items + Pagination */}
        <div className="w-full max-w-[1200px] flex flex-col">
          <div className="grid grid-cols-3 gap-6">
            {displayedItems.map((item, i) => {
              const isFocused = (paneFocus === 'items' && itemsFocusIndex === i);
              return (
                <div
                  key={`${item.name}-${i}`}
                  className={`
                    flex flex-col items-center p-4 border-4 border-[#333d02]
                    cursor-pointer text-[#333d02] bg-white/5
                    ${isFocused ? 'border-yellow-400 blinking-border' : ''}
                  `}
                >
                  <img
                    src={item.path}
                    alt={item.name}
                    className="w-24 h-24 object-contain mb-3"
                  />
                  <div className="text-lg uppercase font-bold font-[MekMono]">
                    {item.name.replace(/_/g, ' ')}
                  </div>
                  <div className="text-md font-[MekMono]">
                    Price: 10 Dubloons
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex flex-row items-center justify-center space-x-6 mt-6">
            {/* PREV */}
            <div
              className={`
                px-6 py-2 border-4 border-[#333d02] cursor-pointer 
                bg-white/5 text-[#333d02] font-[MekMono] text-xl uppercase
                ${paneFocus === 'items' && itemsFocusIndex === displayedItems.length 
                  ? 'border-yellow-400 blinking-border' 
                  : ''
                }
              `}
            >
              Prev
            </div>
            <div className="text-[#333d02] font-[MekMono] text-xl">
              Page {currentPage} / {totalPages || 1}
            </div>
            {/* NEXT */}
            <div
              className={`
                px-6 py-2 border-4 border-[#333d02] cursor-pointer 
                bg-white/5 text-[#333d02] font-[MekMono] text-xl uppercase
                ${paneFocus === 'items' && itemsFocusIndex === displayedItems.length + 1 
                  ? 'border-yellow-400 blinking-border' 
                  : ''
                }
              `}
            >
              Next
            </div>
          </div>
        </div>
      </div>

      {/* Blinking border animation */}
      <style jsx>{`
        @keyframes borderBlink {
          0% { border-color: #facc15; }
          50% { border-color: transparent; }
          100% { border-color: #facc15; }
        }
        .blinking-border {
          animation: borderBlink 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}