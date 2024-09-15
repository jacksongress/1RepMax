import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  onBack: () => void;
}

export default function BackButton({ onBack }: BackButtonProps) {
  return (
    <Button
      onClick={onBack}
      variant="ghost"
      size="sm"
      className="flex items-center text-sky-600 hover:text-sky-700 p-0"
    >
      <ArrowLeft className="h-4 w-4 mr-1" />
      Back
    </Button>
  );
}