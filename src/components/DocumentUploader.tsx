
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { File } from 'lucide-react';

interface DocumentUploaderProps {
  onFileUpload: (file: File) => void;
  isLoading: boolean;
}

const DocumentUploader = ({ onFileUpload, isLoading }: DocumentUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (isValidFileType(file.type)) {
        onFileUpload(file);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (isValidFileType(file.type)) {
        onFileUpload(file);
      }
    }
  };

  const isValidFileType = (fileType: string): boolean => {
    const validTypes = [
      'application/pdf',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    return validTypes.includes(fileType);
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center ${
        isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      } transition-colors duration-200`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".pdf,.ppt,.pptx,.doc,.docx"
        onChange={handleFileSelect}
      />
      <File className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium mb-2">
        Drag & drop your document here
      </h3>
      <p className="text-sm text-gray-500 mb-4">or</p>
      <Button 
        onClick={handleButtonClick} 
        disabled={isLoading}
        className="bg-blue-600 hover:bg-blue-700"
      >
        {isLoading ? 'Processing...' : 'Browse files'}
      </Button>
      <p className="mt-2 text-xs text-gray-500">
        Supported formats: PDF, PowerPoint (PPT/PPTX), Word (DOC/DOCX)
      </p>
    </div>
  );
};

export default DocumentUploader;
