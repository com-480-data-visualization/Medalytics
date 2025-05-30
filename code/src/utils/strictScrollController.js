export const initStrictScrolling = () => {
  // Only run in browser environment
  if (typeof window === 'undefined') return;
  
  // Track scrolling state
  let isScrolling = false;
  let currentSection = 0;
  let totalSections = 0;
  
  // Simplify settings - reduce the number of variables
  const settings = {
    wheelThreshold: 25,         // Slightly reduced threshold
    scrollDebounce: 1000,       // Single debounce value
    animationDuration: 1000     // Slightly faster animation
  };
  
  // Use a single debounce timer for all events
  let debounceTimer = null;
  let wheelAccumulator = 0;
  
  // Get all sections
  const getSections = () => document.querySelectorAll('.snap-section');
  
  // Check if transition is complete
  const isTransitionComplete = () => document.body.classList.contains('transition-complete');
  
  // Scroll to a specific section with more robust error handling
  const scrollToSection = (index) => {
    // Don't do anything if transition isn't complete
    if (!isTransitionComplete()) return;
    
    const sections = getSections();
    totalSections = sections.length;
    
    // Check bounds
    if (index < 0) index = 0;
    if (index >= totalSections) index = totalSections - 1;
    
    // Don't scroll to current section
    if (index === currentSection) return;
    
    // Check if we're already scrolling
    if (isScrolling) return;
    
    isScrolling = true;
    currentSection = index;
    
    try {
      // Scroll to the section with smooth behavior
      sections[index].scrollIntoView({ behavior: 'smooth' });
      
      // Dispatch a custom event to update the page indicator
      window.dispatchEvent(
        new CustomEvent('sectionChange', { 
          detail: { section: index } 
        })
      );
    } catch (e) {
      console.error("Error scrolling to section:", e);
      isScrolling = false; // Reset if there's an error
      return;
    }
    
    // Reset scroll state after animation completes
    setTimeout(() => {
      isScrolling = false;
      // Clear any accumulated scroll that happened during animation
      wheelAccumulator = 0;
    }, settings.animationDuration);
  };
  
  // Get current section index with better position calculation
  const getCurrentSectionIndex = () => {
    const sections = getSections();
    const snapContainer = document.querySelector('.snap-container');
    const scrollTop = snapContainer ? snapContainer.scrollTop : 0;
    
    // Find the closest section based on scroll position
    let bestMatch = 0;
    let bestDistance = Infinity;
    
    sections.forEach((section, index) => {
      const distance = Math.abs(section.offsetTop - scrollTop);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestMatch = index;
      }
    });
    
    return bestMatch;
  };
  
  // Initialize
  const init = () => {
    // Wait for DOM to be ready
    setTimeout(() => {
      const sections = getSections();
      totalSections = sections.length;
      currentSection = getCurrentSectionIndex();
      
      // Add section identifiers for debugging
      sections.forEach((section, index) => {
        section.setAttribute('data-section', `Section ${index + 1}`);
      });
    }, 500);
    
    // Simplified wheel handler with better thresholding
    const handleWheel = (e) => {
      // Don't intercept scrolling if we haven't completed the initial transition
      if (!isTransitionComplete()) return;
      
      // Prevent default scroll
      e.preventDefault();
      
      // If already scrolling, discard this event entirely
      if (isScrolling) {
        wheelAccumulator = 0; // Reset accumulator during scrolling
        return;
      }
      
      // Add to wheel accumulator with a lower damping factor
      wheelAccumulator += (e.deltaY * 0.6);
      
      // Only proceed if we've accumulated enough scrolling
      // and if there's no active debounce timer
      if (Math.abs(wheelAccumulator) >= settings.wheelThreshold && !debounceTimer) {
        const direction = wheelAccumulator > 0 ? 1 : -1;
        
        // Move to next/previous section
        scrollToSection(currentSection + direction);
        
        // Reset accumulator
        wheelAccumulator = 0;
        
        // Set debounce timer
        debounceTimer = setTimeout(() => {
          debounceTimer = null;
        }, settings.scrollDebounce);
      }
      
      // Gradually decay wheel accumulator if below threshold
      // This helps prevent unintentional scrolls from small movements
      if (Math.abs(wheelAccumulator) < settings.wheelThreshold) {
        setTimeout(() => {
          wheelAccumulator *= 0.8; // Decay factor
        }, 100);
      }
    };
    
    // Touch handling with the same simplifications
    let touchStartY = 0;
    let touchMoveAccumulator = 0;
    
    const handleTouchStart = (e) => {
      if (!isTransitionComplete() || isScrolling) return;
      touchStartY = e.touches[0].clientY;
      touchMoveAccumulator = 0;
    };
    
    const handleTouchMove = (e) => {
      if (!isTransitionComplete() || isScrolling) return;
      
      const touchY = e.touches[0].clientY;
      const diff = touchStartY - touchY;
      
      // Add to accumulator with damping
      touchMoveAccumulator += (diff * 0.6);
      
      // Only respond to significant swipes and if no active debounce
      if (Math.abs(touchMoveAccumulator) > settings.wheelThreshold && !debounceTimer) {
        e.preventDefault();
        const direction = touchMoveAccumulator > 0 ? 1 : -1;
        scrollToSection(currentSection + direction);
        
        // Reset accumulator
        touchMoveAccumulator = 0;
        touchStartY = touchY;
        
        // Set debounce timer
        debounceTimer = setTimeout(() => {
          debounceTimer = null;
        }, settings.scrollDebounce);
      }
    };
    
    // Key navigation (unchanged)
    const handleKeyDown = (e) => {
      if (!isTransitionComplete() || isScrolling) return;
      
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        scrollToSection(currentSection + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        scrollToSection(currentSection - 1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        scrollToSection(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        scrollToSection(totalSections - 1);
      }
    };
    
    // Set up event listeners
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    
    // Rest of the code remains unchanged
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class' &&
            document.body.classList.contains('transition-complete')) {
          // Transition just completed, update section tracking
          currentSection = getCurrentSectionIndex();
        }
      });
    });
    observer.observe(document.body, { attributes: true });
    
    // Force initial positioning after transition completes
    const checkTransitionComplete = () => {
      if (isTransitionComplete()) {
        // Get current section index and scroll there
        currentSection = getCurrentSectionIndex();
        // Make sure snap container is scrollable
        const snapContainer = document.querySelector('.snap-container');
        if (snapContainer) {
          snapContainer.style.overflowY = 'scroll';
        }
      } else {
        // Check again in 500ms
        setTimeout(checkTransitionComplete, 500);
      }
    };
    checkTransitionComplete();
    
    // Provide cleanup function
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('keydown', handleKeyDown);
      observer.disconnect();
    };
  };
  
  // Start the controller
  return init();
};