import { Button } from "@/components/ui/button";

interface StartWorkoutButtonProps {
  onStart: () => void;
}

export default function StartWorkoutButton({ onStart }: StartWorkoutButtonProps) {
  return (
    <Button
      onClick={onStart}
      className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out"
    >
      Start Workout
    </Button>
  );
}