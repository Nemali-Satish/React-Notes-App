import React, { useState } from "react";
import ProfileInfo from "../Cards/ProfileInfo";
import { useNavigate } from "react-router-dom";
import SearchBar from "../SearchBar/SearchBar";

const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const onLogout = () => {
    navigate("/login");
  };

  const handelSearch = () => {
    console.log("HandelSearchClick");
  };

  const onClearSearch = () => {
    setSearchQuery("");
  };

  return (
    <div>
      <div className="bg-white flex items-center justify-between px-6 py-2 drop-shadow">
        <div className="text-xl font-medium text-black py-2">Notes</div>
        <SearchBar
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
          }}
          handelSearch={handelSearch}
          onClearSearch={onClearSearch}
        />
        <ProfileInfo onLogout={onLogout} />
      </div>
    </div>
  );
};

export default Navbar;
