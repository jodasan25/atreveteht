import React from "react";
import logoImg from "../../assets/jpg logo (1).png";

interface LogoProps {
  className?: string;
  iconSize?: string;
  hideText?: boolean;
  light?: boolean;
}

export default function Logo({ className = "" }: LogoProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <img
        src={logoImg}
        alt="Atrévete HealthTech Logo"
        style={{ height: "50px", width: "auto", objectFit: "contain" }}
        className="transition-transform duration-300 hover:scale-105"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
