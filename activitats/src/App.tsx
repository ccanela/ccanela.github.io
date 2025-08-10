// src/App.tsx
import { useState } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import StoryCard, { ComingSoonCard } from "./components/StoryCard";
import ActivityPage from "./components/ActivityPage"; // Importarem el nou component
import { stories, levels, Story, Level } from "./data/stories"; // Importem les dades

type View = "story-selection" | "level-selection" | "activity-view";

function App() {
  const [view, setView] = useState<View>("story-selection");
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);

  const handleStorySelect = (story: Story) => {
    setSelectedStory(story);
    setView("level-selection");
  };

  const handleLevelSelect = (level: Level) => {
    setSelectedLevel(level);
    setView("activity-view");
  };

  const handleBackTo = (targetView: "story-selection" | "level-selection") => {
    if (targetView === "story-selection") {
      setSelectedStory(null);
      setSelectedLevel(null);
    }
    setView(targetView);
  };

  const renderStars = (count: number) => {
    return Array(3)
      .fill(0)
      .map((_, i) => (
        <i
          key={i}
          className={`fas fa-star ${
            i < count ? "text-yellow-400" : "text-gray-300"
          }`}
        ></i>
      ));
  };

  // Funció per renderitzar la vista correcta
  const renderCurrentView = () => {
    switch (view) {
      case "activity-view":
        // Assegurem que tenim tot el necessari per renderitzar la pàgina d'activitats
        if (selectedStory && selectedLevel) {
          return (
            <ActivityPage
              story={selectedStory}
              level={selectedLevel}
              onBack={() => handleBackTo("level-selection")}
            />
          );
        }
        // Si no, tornem a la selecció d'històries
        handleBackTo("story-selection");
        return null;

      case "level-selection":
        if (!selectedStory) return null; // Safety check
        return (
          <section className="animate-fadeIn">
            <button
              onClick={() => handleBackTo("story-selection")}
              className="flex items-center gap-2 text-brand-primary font-bold mb-8"
            >
              <i className="fas fa-arrow-left"></i> Tornar als relats
            </button>
            <h1 className="text-4xl font-extrabold text-brand-dark mb-2">
              {selectedStory.title}
            </h1>
            <p className="text-lg text-brand-muted mb-12 max-w-2xl">
              {selectedStory.description}
            </p>

            <h2 className="text-2xl font-bold mb-6 text-brand-dark">
              Tria un nivell
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {levels.map((level) => {
                const isAvailable = selectedStory.availableLevels.includes(
                  level.id
                );
                return (
                  <div
                    key={level.id}
                    onClick={() => isAvailable && handleLevelSelect(level)}
                    className={`block p-6 rounded-xl shadow-lg border-2 transition-all duration-300 ${
                      isAvailable
                        ? "bg-white hover:border-brand-primary hover:shadow-xl hover:-translate-y-1 cursor-pointer"
                        : "bg-gray-100 opacity-60 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-bold text-xl text-brand-dark">
                        {level.name}
                      </h4>
                      <div className="flex text-lg">
                        {renderStars(level.stars)}
                      </div>
                    </div>
                    <p className="text-brand-muted font-body mb-6 h-20">
                      {level.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        );

      case "story-selection":
      default:
        return (
          <>
            <section className="text-center mb-12 animate-fadeIn">
              <h1 className="text-4xl md:text-5xl font-extrabold text-brand-dark mb-2">
                Activitats Interactives
              </h1>
              <p className="text-lg text-brand-muted max-w-2xl mx-auto font-body">
                Descobreix les activitats interactives basades en els relats
                d'Afers Juvenils. /**Aquestes activitats estan dissenyades per
                aprendre i millorar el català, potenciar l'ús de la llengua i
                aprofundir en la comprensió literària.**/ Cada relat és una nova
                pàgina. Explora, reflexiona i posa a prova el teu català.
              </p>
            </section>
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {stories.map((story) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  onClick={() => handleStorySelect(story)}
                />
              ))}
              <ComingSoonCard />
            </section>
          </>
        );
    }
  };

  return (
    <div className="font-sans text-brand-dark flex flex-col min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12 flex-grow">
        {renderCurrentView()}
      </main>
      <Footer />
    </div>
  );
}

export default App;
