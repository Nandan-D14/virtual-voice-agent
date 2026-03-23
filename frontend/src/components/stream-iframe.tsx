"use client";

import { useEffect, useRef, type ComponentPropsWithoutRef } from "react";

type Props = Omit<ComponentPropsWithoutRef<"iframe">, "src"> & {
  src: string;
};

export function StreamIframe({ src, ...props }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    return () => {
      if (iframe) {
        iframe.src = "about:blank";
      }
    };
  }, []);

  return <iframe ref={iframeRef} src={src} {...props} />;
}
