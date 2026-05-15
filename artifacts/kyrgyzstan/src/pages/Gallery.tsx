import { useState } from "react";
import { X } from "lucide-react";
import { useListGalleryPhotos } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Gallery() {
  const { data: photos, isLoading } = useListGalleryPhotos();
  const [selected, setSelected] = useState<number | null>(null);

  const list = photos ?? [];

  const handlePrev = () => {
    if (selected === null) return;
    setSelected((selected - 1 + list.length) % list.length);
  };

  const handleNext = () => {
    if (selected === null) return;
    setSelected((selected + 1) % list.length);
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
        {isLoading ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="break-inside-avoid">
                <Skeleton className={`w-full rounded-lg ${i % 3 === 0 ? 'h-80' : 'h-56'}`} />
              </div>
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground">
            <p className="text-lg">Galerie je zatím prázdná.</p>
            <p className="text-sm mt-2">Přidejte fotografie v administraci.</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {list.map((photo, i) => (
              <div
                key={photo.id}
                className="break-inside-avoid cursor-pointer group relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300"
                onClick={() => setSelected(i)}
              >
                <img
                  src={photo.imageUrl}
                  alt={photo.caption}
                  className="w-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  <p className="text-white font-semibold text-sm leading-tight">{photo.caption}</p>
                  {photo.location && (
                    <p className="text-gray-300 text-xs mt-1">{photo.location}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Lightbox */}
      {selected !== null && list[selected] && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setSelected(null)}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") handlePrev();
            if (e.key === "ArrowRight") handleNext();
            if (e.key === "Escape") setSelected(null);
          }}
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
              src={list[selected].imageUrl}
              alt={list[selected].caption}
              className="max-h-[78vh] max-w-full object-contain rounded-lg shadow-2xl"
            />
            <div className="mt-4 text-center">
              <p className="text-white font-medium text-lg">{list[selected].caption}</p>
              {list[selected].location && (
                <p className="text-gray-400 text-sm mt-1">{list[selected].location}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
