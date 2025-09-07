import { useState } from "react";
import { TopNavigation } from "@/components/TopNavigation";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { Pricing } from "@/components/Pricing";
import { Footer } from "@/components/Footer";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { UploadSection } from "@/components/dashboard/UploadSection";
import { VideoWorkspace } from "@/components/dashboard/VideoWorkspace";
import { EditingPanels } from "@/components/dashboard/EditingPanels";
import { StatusBar } from "@/components/dashboard/StatusBar";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

const Index = () => {
  const [showDashboard, setShowDashboard] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [editingPanelsCollapsed, setEditingPanelsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Landing Page Sections */}
      {!showDashboard && (
        <>
          <TopNavigation />
          <div className="pt-16"> {/* Add padding for fixed nav */}
            <Hero />
            <div className="text-center py-8">
              <Button 
                size="lg" 
                onClick={() => setShowDashboard(true)}
                className="font-fredoka font-medium text-lg px-8 py-4 rounded-2xl"
              >
                Open Dashboard
                <ChevronDown className="ml-2 h-5 w-5" />
              </Button>
            </div>
            <section id="features">
              <Features />
            </section>
            <section id="pricing">
              <Pricing />
            </section>
            <Footer />
          </div>
        </>
      )}

      {/* Dashboard Interface */}
      {showDashboard && (
        <div className="min-h-screen flex flex-col">
          {/* Top Navigation */}
          <DashboardNav />
          
          {/* Back to Landing Button */}
          <div className="p-4 border-b border-border/50">
            <Button 
              variant="ghost" 
              onClick={() => setShowDashboard(false)}
              className="font-fredoka"
            >
              <ChevronUp className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>

          {/* Main Dashboard Layout */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Sidebar */}
            <DashboardSidebar 
              collapsed={sidebarCollapsed} 
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} 
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Upload Section */}
              <div className="p-6 border-b border-border/50">
                <UploadSection />
              </div>

              {/* Video Workspace & Editing Panels */}
              <div className="flex-1 flex overflow-hidden">
                {/* Video Workspace */}
                <div className="flex-1 p-6">
                  <VideoWorkspace />
                </div>

                {/* Right Editing Panels */}
                <div className={`${editingPanelsCollapsed ? 'w-12' : 'w-80'} border-l border-border/50 bg-muted/20 p-4`}>
                  <EditingPanels 
                    collapsed={editingPanelsCollapsed}
                    onToggleCollapse={() => setEditingPanelsCollapsed(!editingPanelsCollapsed)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Status Bar */}
          <StatusBar />
        </div>
      )}
    </div>
  );
};

export default Index;
