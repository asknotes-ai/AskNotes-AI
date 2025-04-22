import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { File, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

interface DocumentUploaderProps {
  onFileUpload: (file: File) => void;
  isLoading: boolean;
}

const DocumentUploader = ({ onFileUpload, isLoading }: DocumentUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF file.",
          variant: "destructive"
        });
      }
    }
  };

  const isValidFileType = (fileType: string): boolean => {
    return fileType === 'application/pdf';
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 group",
        isDragging 
          ? "border-cute-pink-dark bg-cute-pink-light" 
          : "border-cute-blue-dark bg-cute-blue-light/30",
        "hover:scale-[1.02] hover:shadow-lg",
        "animate-subtle-float"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".pdf"
        onChange={handleFileSelect}
      />
      <Heart className="mx-auto h-16 w-16 text-cute-pink-dark mb-4 group-hover:animate-cute-bounce" />
      <h3 className="text-lg font-medium mb-2 text-cute-blue-dark">
        Drag your adorable documents here! 🌈
      </h3>
      <p className="text-sm text-cute-lavender-dark mb-4">or</p>
      <Button 
        onClick={handleButtonClick} 
        disabled={isLoading}
        className="bg-cute-green-dark hover:bg-cute-green hover:scale-105 transition-transform"
      >
        {isLoading ? 'Processing...' : 'Browse cute files 💕'}
      </Button>
      <p className="mt-2 text-xs text-cute-lavender-dark">
        Supported cutie formats: PDF
      </p>
    </div>
  );
};

export default DocumentUploader;
