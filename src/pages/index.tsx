import React, { useState, useEffect, KeyboardEvent } from 'react';
import dynamic from 'next/dynamic';
import { useGlobalControls } from '../hooks/useGlobalControls';

// Import dynamic components
const PhaserGame = dynamic(() => import('../components/PhaserGame'), { ssr: false });
const RuniverseAdventure = dynamic(() => import('../components/Game/RuniverseAdventure'), { ssr: false });
const CharacterSelect = dynamic(() => import('../components/CharacterSelect'), { ssr: false });
const Mint = dynamic(() => import('../components/Mint'), { ssr: false });
const RuniverseMap = dynamic(() => import('../components/RuniverseMap'), { ssr: false });
const CharacterCreation = dynamic(() => import('../components/Game/CharacterCreation'), { ssr: false });

// Updated dynamic import for VillagerCreator using default export
const VillagerCreator = dynamic(() => import('../components/VillagerCreator'), { ssr: false });

export default function HomePage() {
  // Menu navigation
  const [showCharacterSelect, setShowCharacterSelect] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Overlays
  const [showMap, setShowMap] = useState(false);
  const [showCharacterCreation, setShowCharacterCreation] = useState(false);
  const [showAdventure, setShowAdventure] = useState(false);
  const [showMint, setShowMint] = useState(false);
  const [showVillagerCreator, setShowVillagerCreator] = useState(false);

  // Menu items
  const options = [
    'Start Game',
    'Characters',
    'Character Creation',
    'Runiverse Adventure',
    'Mint',
    'Map',
    'Options',
    'Credits',
  ];

  useEffect(() => {
    if (typeof window === 'undefined') return;

    function handleKeyDown(e: KeyboardEvent) {
      const key = e.key.toLowerCase();
      if (showCharacterSelect || showMap || showCharacterCreation || showAdventure || gameStarted || showVillagerCreator || showMint) {
        return;
      }

      if (key === 'arrowup' || key === 'w') {
        setSelectedIndex(prev => (prev - 1 + options.length) % options.length);
      } else if (key === 'arrowdown' || key === 's') {
        setSelectedIndex(prev => (prev + 1) % options.length);
      } else if (key === ' ' || key === 'enter' || key === 'e') {
        const currentOption = options[selectedIndex];
        switch (currentOption) {
          case 'Start Game':
            setGameStarted(true);
            break;
          case 'Characters':
            setShowCharacterSelect(true);
            break;
          case 'Map':
            setShowMap(true);
            break;
          case 'Character Creation':
            setShowCharacterCreation(true);
            break;
          case 'Runiverse Adventure':
            setShowAdventure(true);
            break;
          case 'Mint':
            setShowMint(true);
            break;
          default:
            console.log(`Selected: ${currentOption}`);
            break;
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown as any);
    return () => {
      window.removeEventListener('keydown', handleKeyDown as any);
    };
  }, [
    selectedIndex,
    options,
    showCharacterSelect,
    showMap,
    showCharacterCreation,
    showAdventure,
    showMint,
    gameStarted,
    showVillagerCreator
  ]);

  useGlobalControls({
    onEscape: () => {
      // If any overlay is open, close it
      if (showVillagerCreator) setShowVillagerCreator(false);
      else if (showCharacterSelect) setShowCharacterSelect(false);
      else if (showMap) setShowMap(false);
      else if (showCharacterCreation) setShowCharacterCreation(false);
      else if (showAdventure) setShowAdventure(false);
      else if (showMint) setShowMint(false);
      else if (gameStarted) setGameStarted(false);
    }
  });

  const renderMenu = () => (
    <div className="inline-block border-2 border-[#333] w-full items-center h-full p-2 bg-[url('/img/background.png')] bg-cover bg-center">
      <style jsx>{`
        @keyframes blink {
          0% { opacity: 1; }
          50% { opacity: 0.3; }
          100% { opacity: 1; }
        }
        .blinking-title {
          animation: blink 1.5s ease-in-out infinite;
        }
      `}</style>

      <div className="h-full mx-auto w-[90%] flex items-end">
        <div className="flex flex-row justify-center items-center flex-wrap">
          {options.map((option, index) => (
            <div
              key={option}
              className={`m-[0.3rem_0] uppercase text-[16px] flex justify-center items-center font-['MekMono'] w-1/2
              ${selectedIndex === index ? 'font-bold text-yellow-400' : 'text-white'}
              ${selectedIndex === index ? 'blinking-title' : ''}`}
            >
              {option}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full h-screen flex justify-center items-center bg-[#2d2d2d] overflow-hidden">
      <div className="relative w-[1000px] h-[800px] aspect-[144/240] flex justify-center items-center">
        <img
          src="/RuneBoys/original.png"
          alt="Gameboy Frame"
          className="absolute w-full h-full object-contain [image-rendering:pixelated]"
        />

        <div className="absolute top-[10%] left-[31.75%] w-[370px] h-[365px] aspect-square flex items-center justify-center overflow-hidden bg-black">
          {/* MAIN MENU */}
          {!gameStarted &&
            !showCharacterSelect &&
            !showMap &&
            !showCharacterCreation &&
            !showAdventure &&
            !showMint &&
            !showVillagerCreator &&
            renderMenu()}

          {/* PHASER GAME */}
          {gameStarted &&
            !showCharacterSelect &&
            !showMap &&
            !showCharacterCreation &&
            !showAdventure && !showMint &&
            !showVillagerCreator && (
              <PhaserGame />
          )}

          {/* Character Select Overlay */}
          {showCharacterSelect && (
            <div className="absolute top-0 left-0 w-full h-full bg-black/75">
              <CharacterSelect
                onClose={() => setShowCharacterSelect(false)}
                onOpenVillagerCreator={() => {
                  setShowVillagerCreator(true);
                  setShowCharacterSelect(false);
                }}
              />
            </div>
          )}

          {/* MAP Overlay */}
          {showMap && (
            <div className="absolute top-0 left-0 w-full h-full bg-black/75 flex justify-center items-center">
              <RuniverseMap
                onClose={() => setShowMap(false)}
                width={50}
                height={40}
                gridSize={32}
              />
            </div>
          )}

          {/* Character Creation Overlay */}
          {showCharacterCreation && (
            <div className="absolute top-0 left-0 w-full h-full bg-black/85 overflow-y-auto">
              <CharacterCreation />
            </div>
          )}

          {/* Runiverse Adventure */}
          {showAdventure && (
            <div className="absolute top-0 left-0 w-full h-full bg-black/85">
              <RuniverseAdventure />
            </div>
          )}

          {showMint && (
            <div className="absolute top-0 left-0 w-full h-full bg-black/85">
              <Mint />
            </div>
          )}

          {/* Villager Creator Overlay */}
          {showVillagerCreator && (
            <div className="absolute top-0 left-0 w-full h-full bg-black/85">
              <VillagerCreator onClose={() => setShowVillagerCreator(false)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}