import React, { useState, useEffect } from "react";
import cssText from "data-text:~style.css"
import type { PlasmoContentScript } from "plasmo"
import { TextSelected } from "~features/text-selected";

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

const PlasmoOverlay = () => {
  useEffect(() => {
    const messageListener = (message) => {
      if (message.type === "senpy-result") {
          console.log("Senpy Analysis Result:", message.senpyData);
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => chrome.runtime.onMessage.removeListener(messageListener);
  }, []);

  return (
    <div className="plasmo-z-50 plasmo-flex plasmo-flex-col plasmo-fixed plasmo-top-32 plasmo-right-8 plasmo-space-y-4">
      <TextSelected />
    </div>
  );
};

export default PlasmoOverlay;