import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { DropZone } from '@/components/Upload/DropZone';
import { MediaTile } from '@/components/Gallery/MediaTile';
import { EditModal } from '@/components/EditModal/EditModal';
import { SearchBar } from '@/components/SearchBar';

interface MediaItem {
  id: string;
  originalUrl: string;
  mediumUrl: string | null;
  thumbnailUrl: string | null;
  source: string;
  tags: string[];
  title: string | null;
  description: string | null;
  altText: string | null;
  createdAt: Date;
  processing?: boolean;
}

interface SearchFilters {
  query: string;
  tags: string[];
  source: 'all' | 'local' | 'gdrive';
}

// SearchBar is already memoized at component level

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #0d1117;
  min-height: 100vh;
  color: #f0f6fc;
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 40px;
`;

const Title = styled.h1`
  color: #f0f6fc;
  font-size: 2.5rem;
  margin-bottom: 8px;
  font-weight: 700;
`;

const Subtitle = styled.p`
  color: #8b949e;
  font-size: 1.1rem;
  margin: 0;
  font-weight: 500;
`;

const Section = styled.section`
  margin-bottom: 40px;
`;

const SectionTitle = styled.h2`
  color: #f0f6fc;
  font-size: 1.5rem;
  margin-bottom: 20px;
  font-weight: 600;
`;

const UploadSection = styled(Section)`
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 12px;
  padding: 30px;
`;

const GalleryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 20px;
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid #30363d;
  border-radius: 50%;
  border-top-color: #58a6ff;
  animation: spin 1s linear infinite;
  margin-right: 8px;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const StatusMessage = styled.div<{ type: 'success' | 'error' | 'info' }>`
  padding: 14px 18px;
  border-radius: 8px;
  margin: 16px 0;
  font-size: 14px;
  font-weight: 500;
  
  ${props => {
    switch (props.type) {
      case 'success':
        return `
          background: #0d4b20;
          color: #56d364;
          border: 1px solid #238636;
        `;
      case 'error':
        return `
          background: #8b1538;
          color: #f85149;
          border: 1px solid #da3633;
        `;
      case 'info':
      default:
        return `
          background: #0c2d6b;
          color: #58a6ff;
          border: 1px solid #1f6feb;
        `;
    }
  }}
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #c9d1d9;
  font-weight: 500;
  
  p {
    color: #8b949e;
    font-size: 16px;
    line-height: 1.5;
    margin: 8px 0;
  }
`;

export default function MediaManager() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [filteredMedia, setFilteredMedia] = useState<MediaItem[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [currentSearch, setCurrentSearch] = useState<SearchFilters>({ query: '', tags: [], source: 'all' });
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);

  const loadMedia = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/media');
      const data = await response.json();
      
      if (data.success) {
        setMedia(data.media);
      } else {
        setMessage({ type: 'error', text: 'Failed to load media' });
      }
    } catch (error) {
      console.error('Error loading media:', error);
      setMessage({ type: 'error', text: 'Failed to load media' });
    } finally {
      setIsLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      const response = await fetch('/api/tags');
      const data = await response.json();
      
      if (data.success) {
        setAvailableTags(data.tags);
      }
    } catch (error) {
      console.error('Error loading tags:', error);
      // Don't show error for tags since it's not critical
    }
  };

  const performSearch = useCallback(async (filters: SearchFilters) => {
    try {
      setIsSearching(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (filters.query) params.append('q', filters.query);
      if (filters.tags.length > 0) params.append('tags', filters.tags.join(','));
      if (filters.source !== 'all') params.append('source', filters.source);
      
      const response = await fetch(`/api/search?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setFilteredMedia(data.results);
      } else {
        setMessage({ type: 'error', text: 'Search failed' });
        setFilteredMedia(media); // Fallback to all media
      }
    } catch (error) {
      console.error('Search error:', error);
      setMessage({ type: 'error', text: 'Search failed' });
      setFilteredMedia(media); // Fallback to all media
    } finally {
      setIsSearching(false);
    }
  }, [media]);

  // Load media and tags on component mount
  useEffect(() => {
    loadMedia();
    loadTags();
  }, []);

  // Update filtered media when media or search changes  
  useEffect(() => {
    if (currentSearch.query || currentSearch.tags.length > 0 || currentSearch.source !== 'all') {
      performSearch(currentSearch);
    } else {
      setFilteredMedia(media);
    }
  }, [media, currentSearch, performSearch]);

  const handleSearch = useCallback((filters: SearchFilters) => {
    setCurrentSearch(filters);
  }, []);

  const handleFileUpload = async (files: File[]) => {
    setIsUploading(true);
    setMessage(null);

    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload/local', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        return response.json();
      });

      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter(result => result.success);

      if (successfulUploads.length > 0) {
        setMessage({ 
          type: 'info', 
          text: `${successfulUploads.length} image(s) uploaded and processing in background...` 
        });
        
        // Add new media to the list with processing status
        const newMedia = successfulUploads.map(result => ({
          ...result.media,
          processing: result.media.processing || result.processing
        }));
        setMedia(prev => [...newMedia, ...prev]);

        // Poll for processing completion
        newMedia.forEach(mediaItem => {
          if (mediaItem.processing) {
            pollProcessingStatus(mediaItem.id);
          }
        });
        
        // Refresh tags as new images may have new tags
        loadTags();
      }

      if (successfulUploads.length !== files.length) {
        setMessage({ 
          type: 'error', 
          text: `Failed to upload ${files.length - successfulUploads.length} image(s)` 
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessage({ type: 'error', text: 'Upload failed. Please try again.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleMediaEdit = (mediaItem: MediaItem) => {
    setEditingMedia(mediaItem);
    setEditModalOpen(true);
  };

  const handleEditSave = async (updatedData: Partial<MediaItem> & { editedImage?: Blob }) => {
    if (!editingMedia) return;

    try {
      const formData = new FormData();
      formData.append('title', updatedData.title || '');
      formData.append('description', updatedData.description || '');
      formData.append('altText', updatedData.altText || '');
      formData.append('tags', JSON.stringify(updatedData.tags || []));

      if (updatedData.editedImage) {
        formData.append('editedImage', updatedData.editedImage, 'edited.jpg');
      }

      const response = await fetch(`/api/media/${editingMedia.id}/edit`, {
        method: 'PUT',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update the media item in the list
        setMedia(prev => prev.map(item => 
          item.id === editingMedia.id ? result.media : item
        ));
        
        setMessage({ 
          type: 'success', 
          text: 'Media updated successfully!' 
        });
        
        // Refresh tags as edited media may have new tags
        loadTags();
      } else {
        throw new Error('Failed to update media');
      }
    } catch (error) {
      console.error('Error updating media:', error);
      setMessage({ 
        type: 'error', 
        text: 'Failed to update media. Please try again.' 
      });
    }
  };

  const handleEditClose = () => {
    setEditModalOpen(false);
    setEditingMedia(null);
  };

  // Poll for processing status updates
  const pollProcessingStatus = async (mediaId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/media/${mediaId}/status`);
        if (response.ok) {
          const data = await response.json();
          if (!data.processing) {
            // Processing complete, update the media item
            setMedia(prev => prev.map(item => 
              item.id === mediaId 
                ? { ...data.media, processing: false }
                : item
            ));
            clearInterval(pollInterval);
            setMessage({ 
              type: 'success', 
              text: 'Image processing completed!' 
            });
          }
        }
      } catch (error) {
        console.error('Error polling status:', error);
        clearInterval(pollInterval);
      }
    }, 3000); // Poll every 3 seconds

    // Stop polling after 5 minutes (in case something goes wrong)
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 300000);
  };

  const handleMediaDelete = async (mediaItem: MediaItem) => {
    if (!confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      const response = await fetch(`/api/media/${mediaItem.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMedia(prev => prev.filter(item => item.id !== mediaItem.id));
        setMessage({ type: 'success', text: 'Image deleted successfully' });
      } else {
        setMessage({ type: 'error', text: 'Failed to delete image' });
      }
    } catch (error) {
      console.error('Delete error:', error);
      setMessage({ type: 'error', text: 'Failed to delete image' });
    }
  };

  const handleMediaView = (mediaItem: MediaItem) => {
    // TODO: Implement view modal/page
    window.open(mediaItem.originalUrl, '_blank');
  };

  return (
    <Container>
      <Header>
        <Title>📦 Media Manager</Title>
        <Subtitle>
          Upload, organize, and manage your media files with AI-powered tagging
        </Subtitle>
      </Header>

      <UploadSection>
        <SectionTitle>Upload Images</SectionTitle>
        <DropZone
          onFileSelect={handleFileUpload}
          disabled={isUploading}
        />
        {isUploading && (
          <StatusMessage type="info">
            <LoadingSpinner />
            Processing images... This may take a moment for AI analysis.
          </StatusMessage>
        )}
      </UploadSection>

      {message && (
        <StatusMessage type={message.type}>
          {message.text}
        </StatusMessage>
      )}

      <Section>
        <SectionTitle>Media Gallery</SectionTitle>
        
        {media.length > 0 && (
          <SearchBar
            onSearch={handleSearch}
            availableTags={availableTags}
            isLoading={isSearching}
          />
        )}
        
        {isLoading ? (
          <StatusMessage type="info">
            <LoadingSpinner />
            Loading media...
          </StatusMessage>
        ) : isSearching ? (
          <StatusMessage type="info">
            <LoadingSpinner />
            Searching...
          </StatusMessage>
        ) : media.length === 0 ? (
          <EmptyState>
            <p>No images uploaded yet.</p>
            <p>Upload some images above to get started!</p>
          </EmptyState>
        ) : filteredMedia.length === 0 ? (
          <EmptyState>
            <p>No images found matching your search criteria.</p>
            <p>Try adjusting your search terms or filters.</p>
          </EmptyState>
        ) : (
          <GalleryGrid>
            {filteredMedia.map((mediaItem) => (
              <MediaTile
                key={mediaItem.id}
                media={mediaItem}
                onEdit={handleMediaEdit}
                onDelete={handleMediaDelete}
                onView={handleMediaView}
              />
            ))}
          </GalleryGrid>
        )}
      </Section>
      
      <EditModal
        media={editingMedia}
        isOpen={editModalOpen}
        onClose={handleEditClose}
        onSave={handleEditSave}
      />
    </Container>
  );
}
