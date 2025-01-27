import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface Attribute {
  trait_type: string;
  value: string | number;
  filename: string | null;
  original_value?: string | number;
}

interface Character {
  id: string;
  contract: string;
  name?: string;
  attributes?: Attribute[];
  image?: string;
  background_color?: string;
  consciousId?: string;  // For storing an external ID if needed
}

interface CharacterContextType {
  selectedCharacter: Character | null;
  setSelectedCharacter: (character: { id: string; contract: string }) => void;
  updateCharacterAttributes: (attributes: Attribute[]) => void;
  updateConsciousId: (consciousId: string) => void;
}

const CharacterContext = createContext<CharacterContextType | undefined>(undefined);

export const CharacterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedCharacter, setSelectedCharacterState] = useState<Character | null>(null);

  useEffect(() => {
    const savedCharacter = typeof window !== 'undefined' ? localStorage.getItem('selectedCharacter') : null;
    if (savedCharacter) {
      setSelectedCharacterState(JSON.parse(savedCharacter));
    }
  }, []);

  const setSelectedCharacter = async (character: { id: string; contract: string }) => {
    try {
      // Placeholder API request, adapt to your actual logic or remove if not needed
      const response = await fetch(`/api/character/${character.id}?contract=${character.contract}`);
      const data = await response.json();
      const fullCharacterData = {
        ...character,
        name: data.name,
        attributes: data.attributes,
        image: data.image,
        background_color: data.background_color,
      };
      setSelectedCharacterState(fullCharacterData);
      localStorage.setItem('selectedCharacter', JSON.stringify(fullCharacterData));
    } catch (error) {
      console.error('Error fetching character data:', error);
    }
  };

  const updateCharacterAttributes = (attributes: Attribute[]) => {
    if (selectedCharacter) {
      const updatedCharacter = { ...selectedCharacter, attributes };
      setSelectedCharacterState(updatedCharacter);
      localStorage.setItem('selectedCharacter', JSON.stringify(updatedCharacter));
    }
  };

  const updateConsciousId = (consciousId: string) => {
    if (selectedCharacter) {
      const updatedCharacter = { ...selectedCharacter, consciousId };
      setSelectedCharacterState(updatedCharacter);
      localStorage.setItem('selectedCharacter', JSON.stringify(updatedCharacter));
    }
  };

  return (
    <CharacterContext.Provider
      value={{
        selectedCharacter,
        setSelectedCharacter,
        updateCharacterAttributes,
        updateConsciousId,
      }}
    >
      {children}
    </CharacterContext.Provider>
  );
};

export const useCharacter = (): CharacterContextType => {
  const context = useContext(CharacterContext);
  if (!context) {
    throw new Error('useCharacter must be used within a CharacterProvider');
  }
  return context;
};