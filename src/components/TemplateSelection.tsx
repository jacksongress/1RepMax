import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getWorkoutTemplates, deleteWorkoutTemplate, WorkoutTemplate } from '../lib/firebase/firebaseUtils';
import { useAuth } from '../lib/hooks/useAuth';
import { Trash2 } from 'lucide-react';
import BackButton from './BackButton';

interface TemplateSelectionProps {
  onTemplateSelect: (template: WorkoutTemplate | null) => void;
  onBack: () => void;
}

export default function TemplateSelection({ onTemplateSelect, onBack }: TemplateSelectionProps) {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const { user } = useAuth();

  const loadTemplates = async () => {
    if (user) {
      try {
        const fetchedTemplates = await getWorkoutTemplates(user.uid);
        setTemplates(fetchedTemplates);
      } catch (error) {
        console.error("Error loading templates:", error);
      }
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [user]);

  const handleDeleteTemplate = async (templateId: string) => {
    if (user && templateId) {
      try {
        await deleteWorkoutTemplate(user.uid, templateId);
        // Reload templates after deletion
        loadTemplates();
      } catch (error) {
        console.error("Error deleting template:", error);
        alert("Failed to delete template. Please try again.");
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <BackButton onBack={onBack} />
        <h2 className="text-2xl font-bold text-sky-600">Select a Workout Template</h2>
      </div>
      <Card className="bg-white shadow-md overflow-hidden">
        <CardContent className="p-4">
          <div className="space-y-2">
            {templates.map(template => (
              <div key={template.id} className="flex items-center justify-between">
                <Button
                  onClick={() => onTemplateSelect(template)}
                  className="w-full text-left justify-start mr-2"
                  variant="outline"
                >
                  {template.name}
                </Button>
                <Button
                  onClick={() => handleDeleteTemplate(template.id!)}
                  variant="outline"
                  size="sm"
                  className="flex-shrink-0"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
            <Button
              onClick={() => onTemplateSelect(null)}
              className="w-full"
              variant="default"
            >
              Start Blank Workout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}