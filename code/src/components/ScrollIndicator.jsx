import { useState, useEffect } from 'react';

export default function ScrollIndicator() {
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    const handleScroll = () => {
      // Get the scroll position
      const scrollPosition = window.scrollY || document.documentElement.scrollTop;
      
      // Hide the indicator when user starts scrolling
      if (scrollPosition > 50) {
        setIsVisible(false);
      }
    };
    
    // Add scroll event listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Clean up
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  if (!isVisible) return null;
  
  return (
    <div className="scroll-indicator" id="scrollIndicator">
      <span>Scroll to Discover</span>
      <span className="scroll-arrow">↕</span>
    </div>
  );
}