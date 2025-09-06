import { useState } from "react";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { UploadSection } from "@/components/dashboard/UploadSection";
import { VideoWorkspace } from "@/components/dashboard/VideoWorkspace";
import { EditingPanels } from "@/components/dashboard/EditingPanels";
import { StatusBar } from "@/components/dashboard/StatusBar";

const Dashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [editingPanelsCollapsed, setEditingPanelsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation */}
      <DashboardNav />
      
      <div className="flex flex-1">
        {/* Left Sidebar */}
        <DashboardSidebar 
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col p-4 space-y-4">
          {/* Upload & Start Section */}
          <UploadSection />
          
          {/* Video Workspace */}
          <div className="flex-1 flex gap-4">
            <VideoWorkspace />
            
            {/* Right Editing Panels */}
            <EditingPanels 
              collapsed={editingPanelsCollapsed}
              onToggleCollapse={() => setEditingPanelsCollapsed(!editingPanelsCollapsed)}
            />
          </div>
        </div>
      </div>
      
      {/* Bottom Status Bar */}
      <StatusBar />
    </div>
  );
};

export default Dashboard;