import { useState, useEffect } from 'react';
import './styles.css';
import LogoIntro from './components/LogoIntro';
import ExplanationPage from './components/ExplanationPage';
import ScrollIndicator from './components/ScrollIndicator';
import PageIndicator from './components/PageIndicator';
import ThemeToggle from './components/ThemeToggle';
import AnimatedBackground from './components/AnimatedBackground';
import { initStrictScrolling } from './utils/strictScrollController';
import GenderEvolutionChart from './components/GenderEvolutionChart';
import D3WorldMap from './components/D3WorldMap';
import OlympicSportsTreemap from './components/OlympicSportsTreemap';
import OlympicPodium from './components/OlympicPodium';
import MedalRaceChart from './components/MedalRaceChart';
import CreditsPage from './components/CreditsPage';

function App() {
  const [currentPhase, setCurrentPhase] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  
  // Handle the initial welcome transition
  // useWelcomeTransition(currentPhase, setCurrentPhase, isTransitioning, setIsTransitioning);
  
  // Set up strict scrolling behavior
  useEffect(() => {
    // Initialize strict scrolling behavior (only active after transition)
    const cleanup = initStrictScrolling();
    
    // Notify the scroll controller which section we're starting on
    window.dispatchEvent(
      new CustomEvent('sectionChange', { 
        detail: { section: currentSection } 
      })
    );
    
    // Clean up event listeners on unmount
    return cleanup;
  }, [currentSection]);
  
  // Track current section
  useEffect(() => {
    const handleScroll = () => {
      const snapContainer = document.querySelector('.snap-container');
      const sections = document.querySelectorAll('.snap-section');
      
      if (!snapContainer) return;
      
      const scrollTop = snapContainer.scrollTop;
      let newCurrentSection = 0;
      
      sections.forEach((section, index) => {
        if (scrollTop >= section.offsetTop - 100) {
          newCurrentSection = index;
        }
      });
      
      if (newCurrentSection !== currentSection) {
        setCurrentSection(newCurrentSection);
        
        // Dispatch a custom event to update the page indicator
        window.dispatchEvent(
          new CustomEvent('sectionChange', { 
            detail: { section: newCurrentSection } 
          })
        );
      }
    };
    
    const snapContainer = document.querySelector('.snap-container');
    if (snapContainer) {
      snapContainer.addEventListener('scroll', handleScroll, { passive: true });
    }
    
    return () => {
      if (snapContainer) {
        snapContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, [currentSection]);
  
  return (
    <div className="snap-container">
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Theme Toggle Button */}
      <ThemeToggle />
      
      {/* Page indicator */}
      <PageIndicator />
      
      {/* First section - Logo and Olympics Transition */}
      <div className="snap-section" id="introSection">
        <div className="container">
          <div className="content">
            <LogoIntro />
          </div>
          {currentSection === 0 && <ScrollIndicator />}
        </div>
      </div>
      
      {/* Explanation Page - New section with Olympics logo background */}
      <div className="snap-section" id="explanationSection">
        <div className="container explanation-container">
          <div className="content">
            <ExplanationPage />
          </div>
        </div>
      </div>

      <div className="snap-section" id="dataSection5">
        <div className="container">
          <div className="content">
            <OlympicPodium />
          </div>
        </div>
      </div>

      <div className="snap-section" id="dataSection6">
        <div className="container">
          <div className="content">
            <MedalRaceChart />
          </div>
        </div>
      </div>


      <div className="snap-section" id="dataSection3">
        <div className="container">
          <div className="content">
            <D3WorldMap />
          </div>
        </div>
      </div>

      <div className="snap-section" id="dataSection4">
        <div className="container">
          <div className="content">
            <OlympicSportsTreemap />
          </div>
        </div>
      </div>


      <div className="snap-section" id="dataSection2">
        <div className="container">
          <div className="content">
            <GenderEvolutionChart />
          </div>
        </div>
      </div>



      {/* Credits Page - Final section */}
      <div className="snap-section" id="creditsSection">
        <div className="container">
          <div className="content">
            <CreditsPage />
          </div>
        </div>
      </div>
      
    </div>

    
  );
}

export default App;