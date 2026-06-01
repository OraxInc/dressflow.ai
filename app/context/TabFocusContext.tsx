import React, { createContext, useContext } from "react";

const TabFocusContext = createContext(false);

export const useTabFocused = () => useContext(TabFocusContext);
export const TabFocusProvider = TabFocusContext.Provider;
