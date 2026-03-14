"use client";

import { useEffect, useRef } from "react";
import { GeoLocation } from "@/domain/domain";
import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import ReactDOMServer from "react-dom/server";
import "leaflet/dist/leaflet.css";

interface OpenStreetMapProps {
  location: GeoLocation;
}

const MapComponent = ({ location }: OpenStreetMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const initializeMap = async () => {
      if (!location?.latitude || !location?.longitude) {
        console.log("Unable to load map: Invalid location");
        return;
      }

      const L = await import("leaflet");

      // Remove previous map
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }

      const map = L.map(mapRef.current, {
        zoomControl: false,
        dragging: false,
        touchZoom: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
      }).setView([location.latitude, location.longitude], 16);

      mapInstance.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      const markerSvg = ReactDOMServer.renderToString(
        <MapPin color="#000000" size={36} />,
      );

      const customIcon = L.divIcon({
        html: markerSvg,
        className: "custom-marker",
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      });

      L.marker([location.latitude, location.longitude], {
        icon: customIcon,
      }).addTo(map);

      // Fix tile rendering issue
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    };

    initializeMap();

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [location]);

  return (
    <>
      <style jsx global>{`
        .custom-marker {
          filter: drop-shadow(0 2px 4px rgb(0 0 0 / 0.2));
        }
      `}</style>

      <div
        ref={mapRef}
        style={{ width: "100%", height: "240px" }}
        className="rounded-lg"
      />
    </>
  );
};

const OpenStreetMap = dynamic(() => Promise.resolve(MapComponent), {
  ssr: false,
});

export default OpenStreetMap;