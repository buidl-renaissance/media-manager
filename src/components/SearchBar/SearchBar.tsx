import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';

const SearchContainer = styled.div`
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
`;

const SearchRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const SearchInput = styled.input`
  flex: 1;
  min-width: 200px;
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 6px;
  padding: 10px 12px;
  color: #f0f6fc;
  font-size: 14px;
  
  &::placeholder {
    color: #7d8590;
  }
  
  &:focus {
    outline: none;
    border-color: #0969da;
    box-shadow: 0 0 0 3px rgba(9, 105, 218, 0.1);
  }
`;

const FilterButton = styled.button<{ $active?: boolean }>`
  background: ${props => props.$active ? '#0969da' : '#21262d'};
  border: 1px solid ${props => props.$active ? '#0969da' : '#30363d'};
  border-radius: 6px;
  padding: 8px 12px;
  color: ${props => props.$active ? '#ffffff' : '#f0f6fc'};
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
  
  &:hover {
    background: ${props => props.$active ? '#0860ca' : '#30363d'};
    border-color: ${props => props.$active ? '#0860ca' : '#30363d'};
  }
`;

const TagFilterSection = styled.div`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #30363d;
`;

const TagFilterHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
`;

const TagFilterLabel = styled.label`
  color: #f0f6fc;
  font-size: 14px;
  font-weight: 500;
`;

const TagSearchContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const TagSearchInput = styled.input`
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 6px;
  padding: 6px 8px;
  color: #f0f6fc;
  font-size: 14px;
  min-width: 160px;
  
  &::placeholder {
    color: #7d8590;
  }
  
  &:focus {
    outline: none;
    border-color: #0969da;
  }
`;

const TagDropdownList = styled.div<{ $show: boolean }>`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #0d1117;
  border: 1px solid #30363d;
  border-top: none;
  border-radius: 0 0 6px 6px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  display: ${props => props.$show ? 'block' : 'none'};
  
  /* Prevent scrolling when using keyboard navigation */
  scroll-behavior: smooth;
  
  /* Ensure dropdown doesn't cause layout shift */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
`;

const TagDropdownItem = styled.div<{ $highlighted?: boolean }>`
  padding: 8px 12px;
  cursor: pointer;
  color: #f0f6fc;
  background: ${props => props.$highlighted ? '#21262d' : 'transparent'};
  
  &:hover {
    background: #21262d;
  }
  
  &:last-child {
    border-radius: 0 0 6px 6px;
  }
`;

const NoTagsMessage = styled.div`
  padding: 8px 12px;
  color: #7d8590;
  font-style: italic;
`;

const SelectedTagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
`;

const TagChip = styled.div`
  background: #0969da;
  color: #ffffff;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  
  button {
    background: none;
    border: none;
    color: #ffffff;
    cursor: pointer;
    padding: 0;
    margin: 0;
    font-size: 14px;
    line-height: 1;
    
    &:hover {
      opacity: 0.8;
    }
  }
`;

const ClearButton = styled.button`
  background: none;
  border: none;
  color: #7d8590;
  cursor: pointer;
  font-size: 14px;
  padding: 4px 8px;
  
  &:hover {
    color: #f0f6fc;
  }
`;

interface SearchFilters {
  query: string;
  tags: string[];
  source: 'all' | 'local' | 'gdrive';
}

interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  availableTags: string[];
  isLoading?: boolean;
}

const SearchBarComponent: React.FC<SearchBarProps> = ({
  onSearch,
  availableTags,
  isLoading = false,
}) => {
  const [query, setQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [source, setSource] = useState<'all' | 'local' | 'gdrive'>('all');
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [highlightedTagIndex, setHighlightedTagIndex] = useState(-1);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const shouldMaintainFocusRef = useRef(false);
  const shouldMaintainSearchFocusRef = useRef(false);
  const componentMountedRef = useRef(false);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch({
        query: query.trim(),
        tags: selectedTags,
        source,
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [query, selectedTags, source, onSearch]);

  // Track component mount status
  useEffect(() => {
    componentMountedRef.current = true;
    return () => {
      componentMountedRef.current = false;
    };
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  // Restore focus only when loading completes and focus was lost
  useEffect(() => {
    // Only restore focus when transitioning from loading to not loading
    if (!isLoading && componentMountedRef.current) {
      const timer = setTimeout(() => {
        try {
          // Check if focus was lost and needs restoration
          const activeElement = document.activeElement;
          const searchInputActive = activeElement === searchInputRef.current;
          const tagInputActive = activeElement === tagInputRef.current;
          
          if (!searchInputActive && !tagInputActive) {
            // Focus was lost, restore to the appropriate input
            if (shouldMaintainSearchFocusRef.current && searchInputRef.current && 
                !searchInputRef.current.disabled && document.contains(searchInputRef.current)) {
              searchInputRef.current.focus();
              shouldMaintainSearchFocusRef.current = false;
            } else if (shouldMaintainFocusRef.current && tagInputRef.current && 
                       !tagInputRef.current.disabled && document.contains(tagInputRef.current)) {
              tagInputRef.current.focus();
              shouldMaintainFocusRef.current = false;
            }
          }
          
          // Clear flags after check
          shouldMaintainSearchFocusRef.current = false;
          shouldMaintainFocusRef.current = false;
        } catch (error) {
          console.warn('Failed to restore input focus:', error);
          shouldMaintainSearchFocusRef.current = false;
          shouldMaintainFocusRef.current = false;
        }
      }, 150); // Wait for search operations to complete
      
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Filter available tags based on search query
  const filteredTags = availableTags
    .filter(tag => !selectedTags.includes(tag))
    .filter(tag => tag.toLowerCase().includes(tagSearchQuery.toLowerCase()))
    .sort();

  const handleAddTag = (tagToAdd: string) => {
    if (tagToAdd && !selectedTags.includes(tagToAdd)) {
      setSelectedTags(prev => [...prev, tagToAdd]);
      setTagSearchQuery('');
      setShowTagDropdown(false);
      setHighlightedTagIndex(-1);
      
      // Maintain focus on the input after adding a tag
      setTimeout(() => {
        if (tagInputRef.current) {
          tagInputRef.current.focus();
        }
      }, 10);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setSelectedTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleClearAll = () => {
    setQuery('');
    setSelectedTags([]);
    setSource('all');
    setTagSearchQuery('');
    setShowTagDropdown(false);
    
    // Maintain focus on main search input after clearing
    setTimeout(() => {
      try {
        if (searchInputRef.current && 
            !searchInputRef.current.disabled &&
            document.contains(searchInputRef.current)) {
          searchInputRef.current.focus();
        }
      } catch (error) {
        console.warn('Failed to focus search input after clear:', error);
      }
    }, 50);
  };

  const handleTagSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTagSearchQuery(value);
    setShowTagDropdown(value.length > 0);
    setHighlightedTagIndex(-1);
    shouldMaintainFocusRef.current = true;
  };

  const handleTagSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      setHighlightedTagIndex(prev => 
        prev < filteredTags.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      setHighlightedTagIndex(prev => prev > 0 ? prev - 1 : prev);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (highlightedTagIndex >= 0 && filteredTags[highlightedTagIndex]) {
        handleAddTag(filteredTags[highlightedTagIndex]);
      } else if (filteredTags.length === 1) {
        handleAddTag(filteredTags[0]);
      } else if (tagSearchQuery && filteredTags.some(tag => tag.toLowerCase() === tagSearchQuery.toLowerCase())) {
        const exactMatch = filteredTags.find(tag => tag.toLowerCase() === tagSearchQuery.toLowerCase());
        if (exactMatch) handleAddTag(exactMatch);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setShowTagDropdown(false);
      setHighlightedTagIndex(-1);
    } else if (e.key === 'Tab') {
      // Allow tab to work normally but close dropdown
      setShowTagDropdown(false);
      setHighlightedTagIndex(-1);
    }
  };

  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTagSearchBlur = () => {
    // Delay hiding to allow for click events
    blurTimeoutRef.current = setTimeout(() => setShowTagDropdown(false), 150);
  };

  const handleTagSearchFocus = () => {
    // Cancel any pending blur timeout
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    
    if (tagSearchQuery.length > 0) {
      setShowTagDropdown(true);
    }
  };

  const handleDropdownItemMouseDown = (tag: string) => (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent input from losing focus
    handleAddTag(tag);
  };

  const handleDropdownItemMouseEnter = (index: number) => () => {
    setHighlightedTagIndex(index);
  };

  const hasActiveFilters = query.trim() || selectedTags.length > 0 || source !== 'all';

  return (
    <SearchContainer>
      <SearchRow>
        <SearchInput
          ref={searchInputRef}
          type="text"
          placeholder="Search images by description, alt text, or title..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
          onFocus={() => {
            shouldMaintainSearchFocusRef.current = true;
          }}
          disabled={isLoading}
        />
        
        <FilterButton
          $active={source === 'local'}
          onClick={() => setSource(source === 'local' ? 'all' : 'local')}
          disabled={isLoading}
        >
          Local Only
        </FilterButton>
        
        <FilterButton
          $active={source === 'gdrive'}
          onClick={() => setSource(source === 'gdrive' ? 'all' : 'gdrive')}
          disabled={isLoading}
        >
          Google Drive
        </FilterButton>
        
        {hasActiveFilters && (
          <ClearButton onClick={handleClearAll} disabled={isLoading}>
            Clear All
          </ClearButton>
        )}
      </SearchRow>

      {availableTags.length > 0 && (
        <TagFilterSection>
          <TagFilterHeader>
            <TagFilterLabel>Filter by tags:</TagFilterLabel>
            <TagSearchContainer>
              <TagSearchInput
                ref={tagInputRef}
                type="text"
                placeholder="Search tags..."
                value={tagSearchQuery}
                onChange={handleTagSearchChange}
                onKeyDown={handleTagSearchKeyDown}
                onFocus={handleTagSearchFocus}
                onBlur={handleTagSearchBlur}
                disabled={isLoading}
              />
              <TagDropdownList $show={showTagDropdown && filteredTags.length > 0}>
                {filteredTags.map((tag, index) => (
                  <TagDropdownItem
                    key={tag}
                    $highlighted={index === highlightedTagIndex}
                    onMouseDown={handleDropdownItemMouseDown(tag)}
                    onMouseEnter={handleDropdownItemMouseEnter(index)}
                  >
                    {tag}
                  </TagDropdownItem>
                ))}
              </TagDropdownList>
              {showTagDropdown && filteredTags.length === 0 && tagSearchQuery && (
                <TagDropdownList $show={true}>
                  <NoTagsMessage>No tags found matching &quot;{tagSearchQuery}&quot;</NoTagsMessage>
                </TagDropdownList>
              )}
            </TagSearchContainer>
          </TagFilterHeader>

          {selectedTags.length > 0 && (
            <SelectedTagsContainer>
              {selectedTags.map(tag => (
                <TagChip key={tag}>
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    disabled={isLoading}
                  >
                    ×
                  </button>
                </TagChip>
              ))}
            </SelectedTagsContainer>
          )}
        </TagFilterSection>
      )}
    </SearchContainer>
  );
};

// Export memoized version to prevent unnecessary re-renders
export const SearchBar = React.memo(SearchBarComponent);
SearchBar.displayName = 'SearchBar'; 