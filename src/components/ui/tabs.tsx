import React, { createContext, useContext } from 'react';
import { cn } from "../../lib/utils";

const TabsContext = createContext<{ value: string; onValueChange: (v: string) => void }>({ value: '', onValueChange: () => {} });

export function Tabs({ value, onValueChange, className, children }: any) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={cn("flex flex-col", className)}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, children }: any) {
  return (
    <div className={cn("flex items-center", className)}>
      {children}
    </div>
  );
}

export function TabsTrigger({ value, className, children }: any) {
  const { value: selectedValue, onValueChange } = useContext(TabsContext);
  const isActive = selectedValue === value;
  
  return (
    <button
      data-state={isActive ? "active" : "inactive"}
      onClick={() => onValueChange(value)}
      className={cn("cursor-pointer", className)}
    >
      {children}
    </button>
  );
}
