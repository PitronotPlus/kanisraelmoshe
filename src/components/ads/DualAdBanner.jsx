import React from "react";
import SmartAdBanner from "./SmartAdBanner";

export default function DualAdBanner({ ads = [] }) {
  return (
    <div className="w-full flex gap-4">
      {/* Left banner - 65% */}
      <div className="w-[65%]">
        <SmartAdBanner ads={ads} position="main_leaderboard_left" size="banner" />
      </div>
      
      {/* Right banner - 35% */}
      <div className="w-[35%]">
        <SmartAdBanner ads={ads} position="main_leaderboard_right" size="banner" />
      </div>
    </div>
  );
}