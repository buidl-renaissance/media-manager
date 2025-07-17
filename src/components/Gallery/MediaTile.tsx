import React from 'react';
import styled from 'styled-components';

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

interface MediaTileProps {
  media: MediaItem;
  onEdit?: (media: MediaItem) => void;
  onDelete?: (media: MediaItem) => void;
  onView?: (media: MediaItem) => void;
}

const TileContainer = styled.div`
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
    border-color: #58a6ff;
  }
`;

const ImageContainer = styled.div`
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
`;

const Image = styled.img<{ processing?: boolean }>`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: opacity 0.3s ease;
  opacity: ${props => props.processing ? 0.5 : 1};
`;

const ImageOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(13, 17, 23, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;

  ${TileContainer}:hover & {
    opacity: 1;
  }
`;

const ProcessingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(13, 17, 23, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 1;
  z-index: 2;
`;

const Spinner = styled.div`
  border: 3px solid #30363d;
  border-top: 3px solid #58a6ff;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ProcessingText = styled.div`
  color: #58a6ff;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
`;

const ActionButton = styled.button`
  background: rgba(240, 246, 252, 0.9);
  color: #24292f;
  border: 1px solid #30363d;
  border-radius: 6px;
  padding: 8px 12px;
  margin: 0 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.2s ease;

  &:hover {
    background: #f0f6fc;
    border-color: #58a6ff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
`;

const MetadataContainer = styled.div`
  padding: 12px;
`;

const Title = styled.div`
  font-weight: 600;
  font-size: 14px;
  color: #f0f6fc;
  margin-bottom: 8px;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Description = styled.div`
  font-size: 12px;
  color: #8b949e;
  margin-bottom: 8px;
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
`;

const Tag = styled.span`
  background: #21262d;
  color: #f0f6fc;
  border: 1px solid #30363d;
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 500;
`;

const Metadata = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 10px;
  color: #7d8590;
`;

const SourceBadge = styled.span<{ source: string }>`
  background: ${props => props.source === 'local' ? '#238636' : '#1f6feb'};
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
`;

export const MediaTile: React.FC<MediaTileProps> = ({
  media,
  onEdit,
  onDelete,
  onView,
}) => {
  const displayImage = media.mediumUrl || media.thumbnailUrl || media.originalUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzMwMzYzZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOGI5NDllIiBmb250LXNpemU9IjE0Ij5QUk9DRVNTSU5HPC90ZXh0Pjwvc3ZnPg==';
  const displayTitle = media.title || media.description || media.altText || `Image ${media.id.slice(0, 8)}`;

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(media);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(media);
  };

  const handleView = () => {
    onView?.(media);
  };

  const formatDate = (date: Date) => {
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return 'Unknown date';
      }
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(dateObj);
    } catch {
      return 'Unknown date';
    }
  };

  return (
    <TileContainer onClick={handleView}>
      <ImageContainer>
        <Image
          src={displayImage}
          alt={media.altText || 'Uploaded image'}
          loading="lazy"
          processing={media.processing}
        />
        {media.processing && (
          <ProcessingOverlay>
            <Spinner />
            <ProcessingText>Processing...</ProcessingText>
          </ProcessingOverlay>
        )}
        <ImageOverlay>
          {onEdit && (
            <ActionButton onClick={handleEdit}>
              Edit
            </ActionButton>
          )}
          {onDelete && (
            <ActionButton onClick={handleDelete}>
              Delete
            </ActionButton>
          )}
        </ImageOverlay>
      </ImageContainer>
      
      <MetadataContainer>
        <Title title={displayTitle}>
          {displayTitle}
        </Title>
        
        {media.description && (
          <Description>
            {media.description}
          </Description>
        )}
        
        {media.tags && media.tags.length > 0 && (
          <TagsContainer>
            {media.tags.slice(0, 3).map((tag, index) => (
              <Tag key={index}>{tag}</Tag>
            ))}
            {media.tags.length > 3 && (
              <Tag>+{media.tags.length - 3}</Tag>
            )}
          </TagsContainer>
        )}
        
        <Metadata>
          <SourceBadge source={media.source}>
            {media.source}
          </SourceBadge>
          <span>{formatDate(media.createdAt)}</span>
        </Metadata>
      </MetadataContainer>
    </TileContainer>
  );
}; 