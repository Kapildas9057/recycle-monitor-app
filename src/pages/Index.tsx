import EcoShiftApp from "@/components/EcoShiftApp";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const Index = () => {
  return (
    <ErrorBoundary>
      <EcoShiftApp />
    </ErrorBoundary>
  );
};

export default Index;
