import { useEffect, useState, useRef } from 'react';

export default function ExplanationPage() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  });
  
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef(null);
  
  // Watch for theme changes
  useEffect(() => {
    setIsDarkMode(document.documentElement.getAttribute('data-theme') === 'dark');
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          setIsDarkMode(document.documentElement.getAttribute('data-theme') === 'dark');
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    
    return () => observer.disconnect();
  }, []);
  
  // Set up mouse proximity effect on component mount
  useEffect(() => {
    const logo = document.getElementById('logo-svg');
    const olympicsLogo = document.getElementById('olympics-svg');
    
    if (!logo || !olympicsLogo) return;
    
    // Set initial states
    logo.style.opacity = 0; // Invisible by default
    olympicsLogo.style.opacity = 0.2; // Static low opacity
    
    // Add mouse move event listener
    const handleMouseMove = (e) => {
      // Only process if component is visible/mounted
      if (!containerRef.current) return;
      
      const rect = logo.getBoundingClientRect();
      const logoX = rect.left + rect.width / 2;
      const logoY = rect.top + rect.height / 2;
      
      // Calculate distance from mouse to logo center
      const deltaX = e.clientX - logoX;
      const deltaY = e.clientY - logoY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // Maximum distance to consider for proximity effect
      const maxDistance = 1300;
      
      // Calculate opacity based on distance (closer = more opaque)
      // Using easing function for smoother transition
      let opacity = 0;
      if (distance <= maxDistance) {
        // Normalized distance (0 to 1)
        const normalized = distance / maxDistance;
        // Apply easing function (cubic - smoother than linear)
        opacity = 0.3 - (normalized * normalized * normalized);
      }
      
      logo.style.opacity = opacity;
    };
    
    // Add the event listener directly to the document
    document.addEventListener('mousemove', handleMouseMove);
    
    // Clean up on unmount
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isVisible]); // Re-apply when visibility changes
  
  // Handle visibility for content fade-in
  useEffect(() => {
    const handleIntersection = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      });
    };
    
    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 0.3
    });
    
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);
  
  return (
    <div className="explanation-page" ref={containerRef}>
      {/* Logos positioned relative to viewport/page, outside the content container */}
      <div className="fixed-logo-container">
        {/* Olympics logo in the background with low opacity */}
        <svg
          id="olympics-svg"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 342 158"
          className="olympics-svg"
          style={{ 
            opacity: 0.2,
            position: 'absolute',
            zIndex: 1,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '60vw',
            height: '60vh',
            objectFit: 'contain'
          }}
        >
          <g stroke-width="9.5" stroke={isDarkMode ? "var(--off-white)" : "var(--dark-charcoal)"} fill="none">
            <circle cx="54" cy="54" r="49.25" />
            <circle cx="171" cy="54" r="49.25" />
            <circle cx="288" cy="54" r="49.25" />
            <circle cx="112.5" cy="104" r="49.25" />
            <circle cx="229.5" cy="104" r="49.25" />
            <path d="M93.4,24.45A49.25,49.25 0 0 1 93.4,83.55" />
            <path d="M210.4,24.45A49.25,49.25 0 0 1 210.4,83.55M171,103.25A49.25,49.25 0 0 1 141.45,93.4" />
            <path d="M288,103.25A49.25,49.25 0 0 1 258.45,93.4" />
          </g>
        </svg>
        
        {/* Logo SVG in the foreground */}
        <svg
          id="logo-svg"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 342 158"
          className="logo-svg"
          style={{ 
            opacity: 0,
            position: 'absolute',
            zIndex: 2,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '60vw',
            height: '60vh',
            objectFit: 'contain',
            transition: 'opacity 0s'
          }}
        >
          <path 
            fill={isDarkMode ? "var(--off-white)" : "var(--dark-charcoal)"} 
            d="M117.626,157.952l-.893-9.457c22.956-2.168,40.266-21.213,40.266-44.302,0-.491-.009-.973-.026-1.454l4.667-.196.97-4.648.51.136h0l.125.033,3.102,1.051.121,3.272c.022.598.033,1.196.033,1.806,0,28.018-21.011,51.129-48.874,53.759h0Z"
          />
          <path 
            fill={isDarkMode ? "var(--off-white)" : "var(--dark-charcoal)"} 
            d="M224.374,157.952c-27.863-2.63-48.874-25.741-48.874-53.759,0-.611.011-1.211.034-1.81l.404-3.641,4.382-.939.004,4.762,4.702.179c-.018.48-.026.96-.026,1.45,0,23.089,17.311,42.134,40.267,44.302l-.893,9.457h0Z"
          />
          <path 
            fill={isDarkMode ? "var(--off-white)" : "var(--dark-charcoal)"} 
            d="M171,108.194c-3.426,0-6.851-.325-10.178-.966l1.797-9.329c5.472,1.055,11.288,1.055,16.764,0l1.795,9.329c-3.327.641-6.752.966-10.178.966Z"
          />
          <path 
            fill={isDarkMode ? "var(--off-white)" : "var(--dark-charcoal)"} 
            d="M179.019,107.641l-3.473-2.864-.015-2.34.003-.08c.84-25,19.26-46.532,43.798-51.199l5.828-1.108-.193,5.93c-.814,25-19.213,46.55-43.748,51.242l-2.2,.421v-.002ZM214.765,62.2c-14.94,5.271-26.143,18.382-29.03,33.986,14.937-5.266,26.142-18.382,29.03-33.986Z"
          />
          <path 
            fill={isDarkMode ? "var(--off-white)" : "var(--dark-charcoal)"} 
            d="M161.647,107.297c-.305,0-.612-.029-.918-.088h-.001c-24.503-4.712-42.88-26.258-43.694-51.232l-.193-5.93,5.829,1.108c24.514,4.663,42.933,26.172,43.796,51.145l.08,2.292-1.775,1.55c-.884.753-1.986,1.154-3.122,1.154h-.002ZM127.235,62.201c2.891,15.597,14.093,28.714,29.033,33.985-2.884-15.593-14.092-28.713-29.033-33.985Z"
          />
        </svg>
      </div>
      
      {/* Content container that can be resized independently */}
      <div className="explanation-content-wrapper">
        <div className="explanation-content">
          <p>
          Every Olympic medal tells a story of dedication, triumph, and human spirit. Behind every podium finish lies years of training, moments of doubt, and the unwavering pursuit of excellence. Medalytics brings these stories to life through powerful data visualizations that showcase the heroes and history-makers of the Games.
          </p>
          <p>
          Witness the evolution of athletic excellence across generations.
          </p>
        </div>
      </div>
    </div>
  );
} 