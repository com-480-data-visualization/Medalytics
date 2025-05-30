import React, { useState, useEffect } from 'react';

const PageIndicator = () => {
  const [activePage, setActivePage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  useEffect(() => {
    // Count sections and set total pages
    const sections = document.querySelectorAll('.snap-section');
    setTotalPages(sections.length);
    
    // Handle scroll events
    const handleScroll = () => {
      const snapContainer = document.querySelector('.snap-container');
      const sections = document.querySelectorAll('.snap-section');
      
      if (!snapContainer) return;
      
      // Get current scroll position of the container
      const scrollTop = snapContainer.scrollTop;
      const viewportHeight = window.innerHeight;
      
      // Calculate which section is most visible
      let newActivePage = 0;
      
      // Check visibility for each section
      sections.forEach((section, index) => {
        const sectionRect = section.getBoundingClientRect();
        const visibleHeight = Math.min(sectionRect.bottom, viewportHeight) - 
                              Math.max(sectionRect.top, 0);
        
        // If this section has the most visibility in the viewport
        if (visibleHeight > viewportHeight/2) {
          newActivePage = index;
        }
        
        // Additional check: if we're very close to the top of a section
        if (Math.abs(section.offsetTop - scrollTop) < 50) {
          newActivePage = index;
        }
      });
      
      // Handle the last section specifically
      const lastSection = sections[sections.length - 1];
      if (lastSection && scrollTop + viewportHeight >= snapContainer.scrollHeight - 50) {
        newActivePage = sections.length - 1;
      }
      
      setActivePage(newActivePage);
    };
    
    // Add event listeners
    const snapContainer = document.querySelector('.snap-container');
    if (snapContainer) {
      snapContainer.addEventListener('scroll', handleScroll, { passive: true });
      
      // Also listen for window resize which might affect section positions
      window.addEventListener('resize', handleScroll, { passive: true });
      
      // Initial check after a short delay to ensure everything is rendered
      setTimeout(handleScroll, 100);
      
      // Add additional periodic checks to ensure accuracy
      const intervalCheck = setInterval(handleScroll, 500);
      
      return () => {
        snapContainer.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleScroll);
        clearInterval(intervalCheck);
      };
    }
    
    return () => {
      window.removeEventListener('resize', handleScroll);
    };
  }, []);
  
  // Listen for custom events from App.js about section changes
  useEffect(() => {
    const handleSectionChange = (e) => {
      if (e.detail && typeof e.detail.section === 'number') {
        setActivePage(e.detail.section);
      }
    };
    
    window.addEventListener('sectionChange', handleSectionChange);
    
    return () => {
      window.removeEventListener('sectionChange', handleSectionChange);
    };
  }, []);
  
  return (
    <div className="page-indicator">
      <div className="indicator-line"></div>
      
      <div className="dot-container">
        {Array.from({ length: totalPages }).map((_, index) => (
          <div
            key={index}
            className={`dot ${activePage === index ? 'active' : ''}`}
            onClick={() => {
              const section = document.querySelectorAll('.snap-section')[index];
              if (section) {
                // For snap scrolling, we need to set the scrollTop of the container
                const snapContainer = document.querySelector('.snap-container');
                if (snapContainer) {
                  snapContainer.scrollTo({
                    top: section.offsetTop,
                    behavior: 'smooth'
                  });
                  
                  // Dispatch a custom event to update the page indicator
                  window.dispatchEvent(
                    new CustomEvent('sectionChange', { 
                      detail: { section: index } 
                    })
                  );
                }
              }
            }}
            title={`Go to section ${index + 1}`}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default PageIndicator; 