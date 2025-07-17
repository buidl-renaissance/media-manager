import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

interface DropZoneProps {
  onFileSelect: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
}

const DropZoneContainer = styled.div<{ isDragOver: boolean; disabled: boolean }>`
  border: 2px dashed ${props => 
    props.disabled ? '#484f58' : 
    props.isDragOver ? '#58a6ff' : '#30363d'
  };
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  background-color: ${props => 
    props.disabled ? '#21262d' : 
    props.isDragOver ? '#0c2d6b' : '#0d1117'
  };
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    border-color: ${props => props.disabled ? '#484f58' : '#58a6ff'};
    background-color: ${props => props.disabled ? '#21262d' : '#0c2d6b'};
  }
`;

const DropZoneText = styled.div`
  font-size: 16px;
  color: #f0f6fc;
  margin-bottom: 12px;
  font-weight: 600;
`;

const DropZoneSubText = styled.div`
  font-size: 14px;
  color: #8b949e;
  margin-bottom: 20px;
  font-weight: 500;
`;

const UploadButton = styled.button<{ disabled: boolean }>`
  background-color: ${props => props.disabled ? '#484f58' : '#238636'};
  color: ${props => props.disabled ? '#8b949e' : '#ffffff'};
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);

  &:hover {
    background-color: ${props => props.disabled ? '#484f58' : '#2ea043'};
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(13, 17, 23, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: #f0f6fc;
  font-weight: 600;
  font-size: 14px;
`;

export const DropZone: React.FC<DropZoneProps> = ({
  onFileSelect,
  accept = 'image/*',
  multiple = true,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      onFileSelect(imageFiles);
    }
  }, [onFileSelect, disabled]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;

    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFileSelect(files);
    }
    
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onFileSelect, disabled]);

  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  return (
    <DropZoneContainer
      isDragOver={isDragOver}
      disabled={disabled}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <DropZoneText>
        {isDragOver ? 'Drop images here' : 'Drag and drop images here'}
      </DropZoneText>
      <DropZoneSubText>
        or click to select files
      </DropZoneSubText>
      <UploadButton disabled={disabled} type="button">
        Select Images
      </UploadButton>
      
      <HiddenFileInput
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInputChange}
        disabled={disabled}
      />
      
      {disabled && (
        <LoadingOverlay>
          <div>Uploading...</div>
        </LoadingOverlay>
      )}
    </DropZoneContainer>
  );
}; 