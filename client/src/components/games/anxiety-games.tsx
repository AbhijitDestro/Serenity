"use client";

import { motion } from "framer-motion";
import { CloudRain, Gamepad2, TreePine, Waves, Wind } from "lucide-react";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BreathingActivity } from "./breathing-game";
import { ForestActivity } from "./forest-game";
import { OceanWaves } from "./ocean-waves";
import { RainSounds } from "./rain-sound";

const games = [
  {
    id: "breathing",
    title: "Breathing Patterns",
    description: "Follow calming breathing exercises with visual guidance",
    icon: Wind,
    color: "text-blue-500",
    bgColor: "bg-blue-500/20",
    duration: "5 mins",
  },

  {
    id: "forest",
    title: "Mindful Forest",
    description: "Take a peaceful walk through a virtual forest",
    icon: TreePine,
    color: "text-green-500",
    bgColor: "bg-green-500/20",
    duration: "15 mins",
  },
  {
    id: "waves",
    title: "Ocean Waves",
    description: "Match your breath with gentle ocean waves",
    icon: Waves,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/20",
    duration: "8 mins",
  },
  {
    id: "rain",
    title: "Rain Sounds",
    description: "Listen to the calming sound of rain",
    icon: CloudRain,
    color: "text-gray-500",
    bgColor: "bg-gray-500/20",
    duration: "10 mins",
  },
];

interface AnxietyGamesProps {
  onGamePlayed?: (gameName: string, description: string, duration: number) => Promise<void>;
}

export const AnxietyActivity = ({ onGamePlayed }: AnxietyGamesProps) => {
  const [showGame, setShowGame] = useState(false);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);

  const handleGameStart = async (gameId: string) => {
    setGameStartTime(Date.now());
    if (onGamePlayed) {
      try {
        // Log the start of the activity with 0 duration initially
        await onGamePlayed(
          gameId,
          games.find((g) => g.id === gameId)?.description || "",
          0,
        );
      } catch (error) {
        console.error("Error logging game activity:", error);
      }
    }
  };

  const handleGameComplete = async () => {
    if (gameStartTime && selectedGame && onGamePlayed) {
      const duration = Math.floor((Date.now() - gameStartTime) / 1000); // Duration in seconds
      try {
        await onGamePlayed(
          selectedGame,
          games.find((g) => g.id === selectedGame)?.description || "",
          duration,
        );
      } catch (error) {
        console.error("Error logging game completion:", error);
      }
    }
    setShowGame(false);
    setGameStartTime(null);
  };

  const renderGame = () => {
    switch (selectedGame) {
      case "breathing":
        return <BreathingActivity onComplete={handleGameComplete} />;

      case "forest":
        return <ForestActivity onComplete={handleGameComplete} />;
      case "waves":
        return <OceanWaves onComplete={handleGameComplete} />;
      case "rain":
        return <RainSounds onComplete={handleGameComplete} />;
      default:
        return null;
    }
  };

  return (
    <>
      <Card className="border-primary/10">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-primary" />
            Anxiety Relief Activities
          </CardTitle>
          <CardDescription>
            Interactive exercises to help reduce stress and anxiety
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {games.map((game) => (
              <motion.div
                key={game.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 hover:shadow-md ${game.bgColor} border-transparent hover:border-${game.color.split("-")[1]}-200 dark:hover:border-${game.color.split("-")[1]}-800`}
                  onClick={() => {
                    setSelectedGame(game.id);
                    setShowGame(true);
                    handleGameStart(game.id);
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-lg bg-white/50 dark:bg-black/20 ${game.color}`}
                    >
                      <game.icon className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-foreground">
                        {game.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {game.description}
                      </p>
                      <span className="text-xs font-medium opacity-70 block mt-2">
                        {game.duration}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showGame} onOpenChange={setShowGame}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 overflow-hidden bg-background/95 backdrop-blur-xl">
          <DialogHeader className="p-6 border-b shrink-0">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  games.find((g) => g.id === selectedGame)?.bgColor
                }`}
              >
                {selectedGame &&
                  (() => {
                    const GameIcon = games.find(
                      (g) => g.id === selectedGame,
                    )?.icon;
                    return GameIcon ? (
                      <GameIcon
                        className={`w-5 h-5 ${
                          games.find((g) => g.id === selectedGame)?.color
                        }`}
                      />
                    ) : null;
                  })()}
              </div>
              <div>
                <DialogTitle>
                  {games.find((g) => g.id === selectedGame)?.title}
                </DialogTitle>
                <CardDescription>
                  {games.find((g) => g.id === selectedGame)?.description}
                </CardDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6 relative">
            {renderGame()}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};