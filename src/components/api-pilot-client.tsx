"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { suggestTestPlan } from "@/ai/flows/suggest-test-plan";
import { generateK6Script } from "@/ai/flows/generate-k6-script";
import { zipArtifacts } from "@/ai/flows/zip-artifacts";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Download,
  Users,
  Activity,
  Timer,
  AlertTriangle,
  Rocket,
  FileText,
  Bot,
  CheckCircle,
  ClipboardCopy,
  ArrowRight,
  RefreshCw,
  Archive,
} from "lucide-react";
import { ApiPilotLogo } from "@/components/icons";
import { Separator } from "@/components/ui/separator";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";


type Step = "upload" | "plan" | "script" | "results";

const stepsConfig = [
  { id: "upload", name: "Analyze API", icon: FileText },
  { id: "plan", name: "Create Plan", icon: Bot },
  { id: "script", name: "Generate Script", icon: Rocket },
  { id: "results", name: "Execute & Report", icon: CheckCircle },
];

export default function ApiPilotClient() {
  const [step, setStep] = useState<Step>("upload");
  const [swaggerContent, setSwaggerContent] = useState("");
  const [suggestedTestPlan, setSuggestedTestPlan] = useState("");
  const [customizedTestPlan, setCustomizedTestPlan] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [k6Script, setK6Script] = useState("");
  const [testConfig, setTestConfig] = useState({
    vus: 10,
    duration: "30s",
    environment: "staging",
    testType: "Load Test",
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const { toast } = useToast();
  const testIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const DURATION_SECONDS = parseInt(testConfig.duration);

  const currentStepIndex = useMemo(() => stepsConfig.findIndex((s) => s.id === step), [step]);

  useEffect(() => {
    if (step === "results" && isTestRunning) {
      setTimeElapsed(0);
      setChartData([]);
      testIntervalRef.current = setInterval(() => {
        setTimeElapsed(prev => {
          const newTime = prev + 1;
          if (newTime <= DURATION_SECONDS) {
            setChartData(cd => [...cd, generateDataPoint(newTime, DURATION_SECONDS)]);
            return newTime;
          } else {
            if (testIntervalRef.current) clearInterval(testIntervalRef.current);
            setIsTestRunning(false);
            return DURATION_SECONDS;
          }
        });
      }, 1000);
    }
    return () => {
      if (testIntervalRef.current) clearInterval(testIntervalRef.current);
    };
  }, [step, isTestRunning, DURATION_SECONDS]);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await suggestTestPlan({ swaggerFileContent: swaggerContent });
      setSuggestedTestPlan(result.suggestedTestPlan);
      setCustomizedTestPlan(result.suggestedTestPlan);
      setStep("plan");
    } catch (e) {
      setError("Failed to analyze API. Please check the Swagger/OpenAPI spec and try again.");
      toast({ title: "Analysis Failed", description: "Could not analyze the provided API specification.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateScript = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fullTestPlan = `Environment: ${testConfig.environment}\nTest Type: ${testConfig.testType}\n\n${customizedTestPlan}`;
      const result = await generateK6Script({
        apiDefinition: swaggerContent,
        testPlan: fullTestPlan
      });
      setK6Script(result.k6Script);
      setStep("script");
    } catch (e) {
      setError("Failed to generate k6 script. Please review your test plan and try again.");
      toast({ title: "Generation Failed", description: "Could not generate the k6 script.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRunTest = () => {
    setIsTestRunning(true);
    setStep("results");
  };

  const handleDownload = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Download Started", description: `${filename} is downloading.` });
  };
  
  const handleDownloadArchive = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await zipArtifacts({
        files: [
          { name: 'k6-script.js', content: k6Script },
          { name: 'test-report.json', content: JSON.stringify(chartData, null, 2) },
        ],
      });
      
      const blob = new Blob([Buffer.from(result.zipAsBase64, 'base64')], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = 'api-pilot-artifacts.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Download Started", description: `api-pilot-artifacts.zip is downloading.` });

    } catch (e) {
      setError("Failed to create zip archive.");
      toast({ title: "Archive Failed", description: "Could not create the zip archive.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to Clipboard!"});
  };

  const handleStartNewTest = () => {
    setStep('upload');
    setSwaggerContent('');
    setSuggestedTestPlan('');
    setCustomizedTestPlan('');
    setK6Script('');
    setError(null);
    setIsTestRunning(false);
    if(testIntervalRef.current) clearInterval(testIntervalRef.current);
  }

  const generateDataPoint = (time: number, duration: number) => {
    const vus = Math.min(testConfig.vus, Math.ceil(testConfig.vus * (time / (duration * 0.25))));
    const baseResponseTime = 150;
    const loadFactor = (vus / testConfig.vus) * 100;
    const responseTime = baseResponseTime + loadFactor + (Math.random() - 0.5) * 50;
    const requestsPerSecond = vus * (5 + Math.random() * 2);
    const errorRate = Math.random() < (loadFactor / 2000) ? Math.random() * 0.05 : 0;
  
    return {
      time: `${time}s`,
      VUs: vus,
      'Response Time (p95)': Math.max(50, responseTime).toFixed(2),
      'Requests/sec': requestsPerSecond.toFixed(2),
      'Error Rate': (errorRate * 100).toFixed(2),
    };
  };

  const latestData = chartData.length > 0 ? chartData[chartData.length - 1] : null;

  const renderStepper = () => (
    <div className="flex w-full items-center justify-center">
      {stepsConfig.map((s, index) => (
        <React.Fragment key={s.id}>
          <div className="flex flex-col items-center gap-2 text-center">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                index < currentStepIndex && "border-primary bg-primary text-primary-foreground",
                index === currentStepIndex && "border-primary scale-110",
                index > currentStepIndex && "border-border bg-card text-muted-foreground"
              )}
            >
              <s.icon className="h-5 w-5" />
            </div>
            <p className={cn(
                "text-xs font-medium",
                index <= currentStepIndex ? "text-primary" : "text-muted-foreground"
            )}>
              {s.name}
            </p>
          </div>
          {index < stepsConfig.length - 1 && (
            <Separator className={cn(
              "mx-4 flex-1 transition-all",
              index < currentStepIndex ? 'bg-primary' : 'bg-border'
            )} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderStepContent = () => {
    switch (step) {
      case "upload":
        return (
          <CardContent className="space-y-4 pt-6">
            <Label htmlFor="swagger-input">Swagger/OpenAPI Specification</Label>
            <Textarea
              id="swagger-input"
              value={swaggerContent}
              onChange={(e) => setSwaggerContent(e.target.value)}
              placeholder={'{\n  "openapi": "3.0.0",\n  "info": {\n    "title": "Simple API Overview",\n    "version": "1.0.0"\n  },\n  "paths": {\n    "/": {\n      "get": {\n        "operationId": "listVersionsv2",\n        "summary": "List API versions",\n        "responses": {\n          "200": {\n            "description": "200 response"\n          }\n        }\n      }\n    }\n  }\n}'}
              className="h-72 font-mono text-xs"
            />
          </CardContent>
        );
      case "plan":
        return (
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="environment">Environment</Label>
                <Select value={testConfig.environment} onValueChange={(v) => setTestConfig(c => ({...c, environment: v}))}>
                  <SelectTrigger id="environment"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="staging">Staging</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="testType">Test Type</Label>
                <Select value={testConfig.testType} onValueChange={(v) => setTestConfig(c => ({...c, testType: v}))}>
                  <SelectTrigger id="testType"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Load Test">Load Test</SelectItem>
                    <SelectItem value="Stress Test">Stress Test</SelectItem>
                    <SelectItem value="Spike Test">Spike Test</SelectItem>
                    <SelectItem value="Soak Test">Soak Test</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="test-plan">AI-Suggested Test Plan & SLI/SLOs</Label>
              <Textarea
                id="test-plan"
                value={customizedTestPlan}
                onChange={(e) => setCustomizedTestPlan(e.target.value)}
                className="h-72 font-mono text-xs"
              />
            </div>
          </CardContent>
        );
      case "script":
        return (
          <CardContent className="space-y-6 pt-6">
             <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="vus">Virtual Users (VUs)</Label>
                    <Input id="vus" type="number" value={testConfig.vus} onChange={(e) => setTestConfig(c => ({...c, vus: parseInt(e.target.value)}))} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="duration">Test Duration</Label>
                    <Input id="duration" value={testConfig.duration} onChange={(e) => setTestConfig(c => ({...c, duration: e.target.value}))} />
                </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="k6-script">Generated k6 Script</Label>
                <Button variant="ghost" size="sm" onClick={() => handleCopyToClipboard(k6Script)}>
                  <ClipboardCopy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
              </div>
              <Textarea
                id="k6-script"
                readOnly
                value={k6Script}
                className="h-96 font-mono text-xs bg-muted/30"
              />
            </div>
          </CardContent>
        );
      case "results":
        return (
          <CardContent className="space-y-6 pt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Virtual Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{latestData ? latestData.VUs : '0'}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Requests/sec</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{latestData ? latestData['Requests/sec'] : '0.00'}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Response Time (p95)</CardTitle>
                        <Timer className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{latestData ? latestData['Response Time (p95)'] : '0'}ms</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold text-destructive">{latestData ? latestData['Error Rate'] : '0.00'}%</div></CardContent>
                </Card>
            </div>
            <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.5} />
                        <XAxis dataKey="time" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis yAxisId="left" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis yAxisId="right" orientation="right" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip
                            content={({ active, payload, label }) =>
                                active && payload && payload.length ? (
                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                    <div className="grid grid-cols-1 gap-2">
                                    <div className="flex flex-col">
                                        <span className="text-[0.70rem] uppercase text-muted-foreground">Time</span>
                                        <span className="font-bold text-foreground">{label}</span>
                                    </div>
                                    {payload.map((p, i) => (
                                      <div key={i} className="flex flex-col">
                                          <span className="text-[0.70rem] uppercase text-muted-foreground" style={{color: p.color}}>{p.name}</span>
                                          <span className="font-bold" style={{color: p.color}}>{p.value}</span>
                                      </div>
                                    ))}
                                    </div>
                                </div>
                                ) : null
                            }
                        />
                        <Area yAxisId="left" type="monotone" dataKey="VUs" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                        <Area yAxisId="right" type="monotone" dataKey="Response Time (p95)" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" fillOpacity={0.2} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            {isTestRunning && <Progress value={(timeElapsed / DURATION_SECONDS) * 100} className="w-full" />}
          </CardContent>
        );
      default:
        return null;
    }
  };

  const renderCardFooter = () => {
    return (
        <CardFooter className="flex justify-between">
            {step === "upload" && (
                <Button onClick={handleAnalyze} disabled={!swaggerContent || isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                    Analyze API
                </Button>
            )}
            {step === "plan" && (
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep("upload")}>Back</Button>
                    <Button onClick={handleGenerateScript} disabled={!customizedTestPlan || isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                        Generate Script
                    </Button>
                </div>
            )}
            {step === "script" && (
                <div className="flex w-full justify-between">
                    <Button variant="outline" onClick={() => setStep("plan")}>Back</Button>
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => handleDownload(k6Script, 'k6-script.js', 'text/javascript')}>
                            <Download className="mr-2 h-4 w-4" /> Download Script
                        </Button>
                        <Button onClick={handleRunTest}>
                           <Rocket className="mr-2 h-4 w-4" /> Run Test
                        </Button>
                    </div>
                </div>
            )}
            {step === "results" && (
                <div className="flex w-full justify-between items-center">
                    {isTestRunning ? (
                      <div className="text-sm text-muted-foreground flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary"/> Test in progress... {timeElapsed}s / {DURATION_SECONDS}s
                      </div>
                    ) : (
                      <div className="text-sm text-accent-foreground flex items-center bg-accent/90 rounded-md px-3 py-1.5">
                        <CheckCircle className="mr-2 h-4 w-4"/> Test Completed
                      </div>
                    )}
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={handleDownloadArchive} disabled={isTestRunning || isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Archive className="mr-2 h-4 w-4" />}
                             Download Archive
                        </Button>
                        <Button onClick={handleStartNewTest} disabled={isTestRunning}>
                            <RefreshCw className="mr-2 h-4 w-4" /> New Test
                        </Button>
                    </div>
                </div>
            )}
        </CardFooter>
    )
  }

  return (
    <div className="w-full max-w-6xl space-y-8">
      <div className="flex flex-col items-center space-y-2 text-center">
        <ApiPilotLogo className="h-12 w-12 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          API Pilot
        </h1>
        <p className="max-w-2xl text-muted-foreground md:text-lg">
          Generate k6 performance test scripts for your API with the power of AI.
        </p>
      </div>

      <div className="px-4 py-6 md:px-8">
        {renderStepper()}
      </div>

      <Card className="w-full transition-all">
        <CardHeader>
          <CardTitle className="text-2xl">{stepsConfig[currentStepIndex].name}</CardTitle>
          <CardDescription>
            {step === 'upload' && "Start by providing your API's Swagger/OpenAPI specification."}
            {step === 'plan' && "Review the AI-suggested test plan and customize it for your needs."}
            {step === 'script' && "Configure test parameters and review the generated k6 script."}
            {step === 'results' && "Monitor real-time test execution and view performance reports."}
          </CardDescription>
        </CardHeader>
        {renderStepContent()}
        <Separator className="my-0" />
        {renderCardFooter()}
      </Card>
      {error && <p className="text-center text-sm text-destructive">{error}</p>}
    </div>
  );
}
