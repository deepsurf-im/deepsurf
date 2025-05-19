'use client';

/* eslint-disable @next/next/no-img-element */
import { ImagesIcon, PlusIcon } from 'lucide-react';
import { useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { Message } from './ChatWindow';

type Image = {
  url: string;
  img_src: string;
  title: string;
};

const SearchImages = ({
  query,
  chatHistory,
  messageId,
}: {
  query: string;
  chatHistory: Message[];
  messageId: string;
}) => {
  const [images, setImages] = useState<Image[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [slides, setSlides] = useState<any[]>([]);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  const handleImageLoad = (imgSrc: string) => {
    setLoadedImages(prev => new Set([...prev, imgSrc]));
  };

  const handleImageError = (imgSrc: string) => {
    setLoadedImages(prev => {
      const newSet = new Set(prev);
      newSet.delete(imgSrc);
      return newSet;
    });
  };

  const searchImages = async () => {
    setLoading(true);
    setError(null);
    setLoadedImages(new Set());

    try {
      const chatModelProvider = localStorage.getItem('chatModelProvider');
      const chatModel = localStorage.getItem('chatModel');
      const customOpenAIBaseURL = localStorage.getItem('openAIBaseURL');
      const customOpenAIKey = localStorage.getItem('openAIApiKey');

      const res = await fetch(`/api/images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          chatHistory: chatHistory,
          chatModel: {
            provider: chatModelProvider,
            model: chatModel,
            ...(chatModelProvider === 'custom_openai' && {
              customOpenAIBaseURL: customOpenAIBaseURL,
              customOpenAIKey: customOpenAIKey,
            }),
          },
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to fetch images');
      }

      const data = await res.json();
      const images = data.images ?? [];
      
      if (images.length === 0) {
        setError('No images found for this query');
      } else {
        setImages(images);
        setSlides(
          images.map((image: Image) => ({
            src: image.img_src,
            alt: image.title,
          }))
        );
      }
    } catch (err) {
      setError('Failed to load images. Please try again.');
      console.error('Error searching images:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!loading && images === null && !error && (
        <button
          id={`search-images-${messageId}`}
          onClick={searchImages}
          className="border border-dashed border-light-200 dark:border-dark-200 hover:bg-light-200 dark:hover:bg-dark-200 active:scale-95 duration-200 transition px-4 py-2 flex flex-row items-center justify-between rounded-lg dark:text-white text-sm w-full"
        >
          <div className="flex flex-row items-center space-x-2">
            <ImagesIcon size={17} />
            <p>Search images</p>
          </div>
          <PlusIcon className="text-[#24A0ED]" size={17} />
        </button>
      )}

      {error && (
        <div className="text-red-500 text-sm p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
          {error}
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-2 gap-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-light-secondary dark:bg-dark-secondary h-32 w-full rounded-lg animate-pulse aspect-video object-cover"
            />
          ))}
        </div>
      )}

      {images && images.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-2">
            {images.slice(0, 3).map((image, i) => (
              <div
                key={i}
                className="relative aspect-video rounded-lg overflow-hidden bg-light-secondary dark:bg-dark-secondary"
              >
                <img
                  onClick={() => {
                    setOpen(true);
                    setSlides([
                      slides[i],
                      ...slides.slice(0, i),
                      ...slides.slice(i + 1),
                    ]);
                  }}
                  src={image.img_src}
                  alt={image.title}
                  className={`h-full w-full object-cover transition duration-200 active:scale-95 hover:scale-[1.02] cursor-zoom-in ${
                    loadedImages.has(image.img_src) ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => handleImageLoad(image.img_src)}
                  onError={() => handleImageError(image.img_src)}
                />
                {!loadedImages.has(image.img_src) && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-[#24A0ED] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            ))}

            {images.length > 3 && (
              <button
                onClick={() => setOpen(true)}
                className="bg-light-100 hover:bg-light-200 dark:bg-dark-100 dark:hover:bg-dark-200 transition duration-200 active:scale-95 hover:scale-[1.02] h-auto w-full rounded-lg flex flex-col justify-between text-white p-2"
              >
                <div className="flex flex-row items-center space-x-1">
                  {images.slice(3, 6).map((image, i) => (
                    <div key={i} className="relative h-6 w-12 lg:h-3 lg:w-6">
                      <img
                        src={image.img_src}
                        alt={image.title}
                        className={`h-full w-full rounded-md lg:rounded-sm aspect-video object-cover ${
                          loadedImages.has(image.img_src) ? 'opacity-100' : 'opacity-0'
                        }`}
                        onLoad={() => handleImageLoad(image.img_src)}
                        onError={() => handleImageError(image.img_src)}
                      />
                      {!loadedImages.has(image.img_src) && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-3 h-3 border-2 border-[#24A0ED] border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-black/70 dark:text-white/70 text-xs">
                  View {images.length - 3} more
                </p>
              </button>
            )}
          </div>
          <Lightbox
            open={open}
            close={() => setOpen(false)}
            slides={slides}
            carousel={{
              finite: true,
            }}
            controller={{
              closeOnBackdropClick: true,
            }}
          />
        </>
      )}
    </>
  );
};

export default SearchImages;
