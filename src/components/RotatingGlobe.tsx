import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';

interface City {
  name: string;
  coords: [number, number];
}

const CITIES: City[] = [
  { name: 'LONDON', coords: [-0.1278, 51.5074] },
  { name: 'TOKYO', coords: [139.6503, 35.6762] },
  { name: 'NEW YORK', coords: [-74.006, 40.7128] },
  { name: 'PARIS', coords: [2.3522, 48.8566] },
  { name: 'DUBAI', coords: [55.2708, 25.2048] },
  { name: 'SINGAPORE', coords: [103.8198, 1.3521] },
  { name: 'SYDNEY', coords: [151.2093, -33.8688] },
  { name: 'SAO PAULO', coords: [-46.6333, -23.5505] },
  { name: 'BERLIN', coords: [13.405, 52.52] },
  { name: 'HONG KONG', coords: [114.1694, 22.3193] },
];

export const RotatingGlobe: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [worldData, setWorldData] = useState<ReturnType<typeof topojson.feature> | null>(null);

  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then((response) => response.json())
      .then((data: { objects: { countries: object } }) => {
        setWorldData(topojson.feature(data, data.objects.countries));
      });
  }, []);

  useEffect(() => {
    if (!worldData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    let animationFrameId: number;
    let rotation = 0;

    const render = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      const radius = Math.min(width, height) / 2 - 5;
      const projection = d3
        .geoOrthographic()
        .scale(radius)
        .translate([width / 2, height / 2])
        .rotate([rotation, -15]);

      const path = d3.geoPath(projection, context);

      context.clearRect(0, 0, width, height);

      // Atmosphere/Glow — use accent colors from theme
      const gradient = context.createRadialGradient(
        width / 2,
        height / 2,
        radius * 0.8,
        width / 2,
        height / 2,
        radius
      );
      gradient.addColorStop(0, 'rgba(100, 138, 255, 0)');
      gradient.addColorStop(1, 'rgba(100, 138, 255, 0.2)');
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(width / 2, height / 2, radius, 0, 2 * Math.PI);
      context.fill();

      // Graticule
      context.beginPath();
      context.strokeStyle = 'rgba(100, 138, 255, 0.1)';
      context.lineWidth = 0.5;
      path(d3.geoGraticule()());
      context.stroke();

      // Countries
      context.beginPath();
      context.strokeStyle = 'rgba(100, 138, 255, 0.4)';
      context.fillStyle = 'rgba(100, 138, 255, 0.1)';
      context.lineWidth = 1;
      path(worldData);
      context.fill();
      context.stroke();

      // Cities
      CITIES.forEach((city) => {
        const [lon, lat] = city.coords;
        const point = projection([lon, lat]);

        if (point) {
          const geoDistance = d3.geoDistance([lon, lat], [-rotation, 15]);
          if (geoDistance < Math.PI / 2) {
            context.beginPath();
            context.arc(point[0], point[1], 2, 0, 2 * Math.PI);
            context.fillStyle = '#fff';
            context.shadowBlur = 10;
            context.shadowColor = '#648aff';
            context.fill();
            context.shadowBlur = 0;

            context.font = '10px "Space Grotesk", sans-serif';
            context.fillStyle = 'rgba(229, 225, 228, 0.8)';
            context.fillText(city.name, point[0] + 5, point[1] - 5);
          }
        }
      });

      rotation += 0.25;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [worldData]);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="w-[240px] h-[240px] sm:w-[280px] sm:h-[280px] md:w-[450px] md:h-[450px] lg:w-[550px] lg:h-[550px] cursor-move"
      />
    </div>
  );
};
