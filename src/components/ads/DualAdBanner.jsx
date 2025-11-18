import React from "react";
import SmartAdBanner from "./SmartAdBanner";

export default function DualAdBanner({ ads = [] }) {
  return (
    <div className="w-full flex gap-4" dir="rtl">
      {/* Right side in RTL - 35% (Small) */}
      <div className="w-[35%]">
        <SmartAdBanner ads={ads} position="main_leaderboard_left" size="banner" />
      </div>
      
      {/* Left side in RTL - 65% (Large) */}
      <div className="w-[65%]">
        <SmartAdBanner ads={ads} position="main_leaderboard_right" size="banner" />
      </div>
    </div>
  );
}