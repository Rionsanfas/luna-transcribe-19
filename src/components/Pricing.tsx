import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap } from "lucide-react";
import Spline from '@splinetool/react-spline';
const monthlyPlans = [{
  name: "Basic",
  price: "$19.99",
  period: "/month",
  tokens: "100 tokens",
  description: "Ideal for individual users or small creators",
  features: ["100 tokens/month", "Video transcription and translation", "25 languages supported", "Secure video storage", "Basic support", "Unused tokens don't expire"],
  popular: false,
  productId: "81152fa6-ca1a-465f-9c3d-384dc8c6a8a9",
  checkoutUrl: "https://buy.polar.sh/polar_cl_kMANTyyNaBCkcfUo1aJ5uKu2DkhBF4ipQYJem43NY6W"
}, {
  name: "Pro",
  price: "$99.99",
  period: "/month",
  tokens: "500 tokens",
  description: "Suited for growing creators or small businesses",
  features: ["500 tokens/month", "All Basic features", "Priority support", "Custom subtitle styling", "Font, size, position options", "Advanced processing"],
  popular: true,
  productId: "fafc1617-826a-4f61-ba37-3fe0a1dce8d9",
  checkoutUrl: "https://buy.polar.sh/polar_cl_Tliw1m9lc7bcQ3EfSWBenC5i2s22ujnKHy26r0pfiil"
}, {
  name: "Premium",
  price: "$359.99",
  period: "/month",
  tokens: "1,800 tokens",
  description: "Designed for professional users or businesses",
  features: ["1,800 tokens/month", "All Pro features", "Enhanced processing speed", "Advanced customization options", "Priority processing queue", "Dedicated support"],
  popular: false,
  productId: "e2a82b41-2a06-46b9-84ea-d196f758f2b2",
  checkoutUrl: "https://buy.polar.sh/polar_cl_Y3Znzem1OYAsPCF3hSxP6dkoG44iYrKgPAHic1MjMOi"
}, {
  name: "Custom",
  price: "Variable",
  period: "",
  tokens: "Variable tokens",
  description: "Tailored for enterprises or high-volume users",
  features: ["Flexible token allocation", "Personalized support", "Custom integrations", "Enterprise SLA", "Dedicated account manager", "Custom pricing negotiation"],
  popular: false,
  productId: "dbf10011-1973-4639-9723-81fd8d4f96c1",
  checkoutUrl: "https://buy.polar.sh/polar_cl_6vL2qZ4pIDPkzWZsXAeHcIFYlojx5TJKvklIW1UMhPO"
}];
const yearlyPlans = [{
  name: "Basic",
  price: "$238.99",
  period: "/year",
  tokens: "1,200 tokens",
  description: "Ideal for individual users or small creators",
  features: ["1,200 tokens/year", "Video transcription and translation", "25 languages supported", "Secure video storage", "Basic support", "20% yearly savings"],
  popular: false,
  productId: "64da80d5-3fe4-4a76-84d0-e56c607ffe61",
  checkoutUrl: "https://buy.polar.sh/polar_cl_sHe3MBHYXlwezDiO7cAj8ZnRQTtD6MhE7pwgy0H05YD"
}, {
  name: "Pro",
  price: "$1,198.99",
  period: "/year",
  tokens: "6,000 tokens",
  description: "Suited for growing creators or small businesses",
  features: ["6,000 tokens/year", "All Basic features", "Priority support", "Custom subtitle styling", "Font, size, position options", "20% yearly savings"],
  popular: true,
  productId: "2540c60b-9ef0-4c22-a1ce-7c2ab2ba9fda",
  checkoutUrl: "https://buy.polar.sh/polar_cl_m2n4kxBPT0WBtyNKWHo6wN05Wk7QmNMfkx6eU0zkM4k"
}, {
  name: "Premium",
  price: "$4,318.99",
  period: "/year",
  tokens: "21,600 tokens",
  description: "Designed for professional users or businesses",
  features: ["21,600 tokens/year", "All Pro features", "Enhanced processing speed", "Advanced customization options", "Priority processing queue", "20% yearly savings"],
  popular: false,
  productId: "1b319610-f033-4915-ba8a-71515342cc49",
  checkoutUrl: "https://buy.polar.sh/polar_cl_uRpszpsHKmwTyKLiFM1mphRQS3yKDURSGBbjY25SCSs"
}, {
  name: "Custom",
  price: "Variable",
  period: "",
  tokens: "Variable tokens",
  description: "Tailored for enterprises or high-volume users",
  features: ["Flexible token allocation", "Personalized support", "Custom integrations", "Enterprise SLA", "Dedicated account manager", "Custom pricing negotiation"],
  popular: false,
  productId: "91e74ded-3e16-4511-b299-f10b35778870",
  checkoutUrl: "https://buy.polar.sh/polar_cl_feKNJww7PMRcA7VKxkoBDjRNfkFML4GTihGaE1riZkm"
}];
export const Pricing = () => {
  const [isYearly, setIsYearly] = useState(false);
  const currentPlans = isYearly ? yearlyPlans : monthlyPlans;
  const handleGetStarted = (checkoutUrl: string) => {
    window.open(checkoutUrl, '_blank');
  };
  return <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <Spline
            scene="https://prod.spline.design/6Ik3ijGEYEUWVNok/scene.splinecode"
            className="w-full h-full opacity-30 scale-75"
          />
        </div>
      
      <div className="relative z-20 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-fredoka font-bold mb-6">
            Choose Your <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Plan</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Get started with our flexible pricing options designed for every need
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={`text-sm font-medium ${!isYearly ? 'text-primary' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <button onClick={() => setIsYearly(!isYearly)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isYearly ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isYearly ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className={`text-sm font-medium ${isYearly ? 'text-primary' : 'text-muted-foreground'}`}>
              Yearly
              <Badge className="ml-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                20% OFF
              </Badge>
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative z-10 max-w-6xl mx-auto">
          {currentPlans.map((plan, index) => (
            <GlassCard key={index} className="p-8 hover:scale-105 transition-transform duration-300 relative">
              {plan.popular && (
                <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium absolute -top-4 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                  Most Popular
                </div>
              )}
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold mb-4">{plan.name}</h3>
                <div className="text-4xl font-bold text-primary mb-6">
                  {plan.price}
                  <span className="text-lg text-muted-foreground">
                    {isYearly ? "/year" : "/month"}
                  </span>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center text-base">
                    <span className="text-primary mr-3 text-lg">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <Button 
                className="w-full bg-primary hover:bg-primary/90 py-3 text-lg"
                onClick={() => handleGetStarted(plan.checkoutUrl)}
              >
                Get Started
              </Button>
            </GlassCard>
          ))}
        </div>

        {/* Token explanation */}
        <div className="mt-16 text-center">
          
        </div>
      </div>
    </section>;
};