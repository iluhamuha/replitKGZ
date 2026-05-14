import { useState } from "react";
import { X } from "lucide-react";

const photos = [
  {
    src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=85",
    thumb: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&q=75",
    caption: "Tian Shan — Nebeské hory",
    location: "Kyrgyzstán",
  },
  {
    src: "https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=1200&q=85",
    thumb: "https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=600&q=75",
    caption: "Jezero Issyk-Kul za svítání",
    location: "Oblast Issyk-Kul",
  },
  {
    src: "https://images.unsplash.com/photo-1563906267088-b029e7101114?auto=format&fit=crop&w=1200&q=85",
    thumb: "https://images.unsplash.com/photo-1563906267088-b029e7101114?auto=format&fit=crop&w=600&q=75",
    caption: "Pamírská dálnice",
    location: "Oblast Osh",
  },
  {
    src: "https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=1200&q=85",
    thumb: "https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=600&q=75",
    caption: "Jurty na pastvině Song-Köl",
    location: "Centrální Kyrgyzstán",
  },
  {
    src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=85",
    thumb: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=75",
    caption: "Horský průsmyk",
    location: "Tian Shan",
  },
  {
    src: "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=1200&q=85",
    thumb: "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=600&q=75",
    caption: "Vrcholy Tian Shan při východu slunce",
    location: "Severní Kyrgyzstán",
  },
  {
    src: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=85",
    thumb: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=600&q=75",
    caption: "Noční obloha nad horami",
    location: "Kyrgyzstán",
  },
  {
    src: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=85",
    thumb: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=600&q=75",
    caption: "Ranní mlha v údolí",
    location: "Oblast Naryn",
  },
  {
    src: "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1200&q=85",
    thumb: "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=600&q=75",
    caption: "Alpské louky Kyrgyzstánu",
    location: "Centrální Kyrgyzstán",
  },
  {
    src: "https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?auto=format&fit=crop&w=1200&q=85",
    thumb: "https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?auto=format&fit=crop&w=600&q=75",
    caption: "Lesnatá horská krajina",
    location: "Oblast Čuj",
  },
  {
    src: "https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&w=1200&q=85",
    thumb: "https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&w=600&q=75",
    caption: "Zamrzlé horské jezero",
    location: "Tian Shan",
  },
  {
    src: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=1200&q=85",
    thumb: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=600&q=75",
    caption: "Vodopád v horském údolí",
    location: "Oblast Karakol",
  },
];

export default function Gallery() {
  const [selected, setSelected] = useState<number | null>(null);

  const handlePrev = () => {
    if (selected === null) return;
    setSelected((selected - 1 + photos.length) % photos.length);
  };

  const handleNext = () => {
    if (selected === null) return;
    setSelected((selected + 1) % photos.length);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") handlePrev();
    if (e.key === "ArrowRight") handleNext();
    if (e.key === "Escape") setSelected(null);
  };

  return (
    <div className="min-h-screen pb-16">
      {/* Header */}
      <div className="relative w-full h-52 flex items-end overflow-hidden">
        <div className="absolute inset-0 bg-black/55 z-10" />
        <img
          src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2000&q=80"
          alt="Kyrgyzstán"
          className="absolute inset-0 w-full h-full object-cover object-[center_30%]"
        />
        <div className="container relative z-20 px-4 pb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight drop-shadow-lg">Galerie</h1>
          <p className="text-gray-300 mt-2 text-lg">Kyrgyzstán očima našich cestovatelů</p>
        </div>
      </div>

      {/* Grid */}
      <section className="container mx-auto px-4 py-12">
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {photos.map((photo, i) => (
            <div
              key={i}
              className="break-inside-avoid cursor-pointer group relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300"
              onClick={() => setSelected(i)}
            >
              <img
                src={photo.thumb}
                alt={photo.caption}
                className="w-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <p className="text-white font-semibold text-sm leading-tight">{photo.caption}</p>
                <p className="text-gray-300 text-xs mt-1">{photo.location}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Lightbox */}
      {selected !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setSelected(null)}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-10 p-2"
            onClick={() => setSelected(null)}
          >
            <X className="h-8 w-8" />
          </button>

          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors text-4xl font-light px-4 py-6 select-none z-10"
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
          >
            ‹
          </button>

          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors text-4xl font-light px-4 py-6 select-none z-10"
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
          >
            ›
          </button>

          <div
            className="max-w-5xl max-h-[90vh] mx-12 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={photos[selected].src}
              alt={photos[selected].caption}
              className="max-h-[78vh] max-w-full object-contain rounded-lg shadow-2xl"
            />
            <div className="mt-4 text-center">
              <p className="text-white font-medium text-lg">{photos[selected].caption}</p>
              <p className="text-gray-400 text-sm mt-1">{photos[selected].location}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
