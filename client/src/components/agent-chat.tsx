import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Send, Bot, User, Loader2, MessageSquare, Image, FileText, 
  Search, Calendar, Play, Trash2, Plus, Upload, Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import type { Agent, AgentTask } from "@shared/schema";
import { useTranslation } from "@/lib/i18n";

interface Message {
  role: "user" | "assistant";
  content: string;
  type?: "text" | "image" | "analysis" | "search";
  imageUrl?: string;
}

interface AgentChatProps {
  agent: Agent;
}

export function AgentChat({ agent }: AgentChatProps) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const [imagePrompt, setImagePrompt] = useState("");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<{ url: string; prompt: string }[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<string | null>(null);

  const [documentQuestion, setDocumentQuestion] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskType, setNewTaskType] = useState("report");

  const { data: tasks = [] } = useQuery<AgentTask[]>({
    queryKey: [`/api/agents/${agent.id}/tasks`],
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/agents/${agent.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          history: messages,
        }),
      });

      if (!response.ok) throw new Error("Chat failed");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let assistantMessage = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                assistantMessage += data.content;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = {
                    role: "assistant",
                    content: assistantMessage,
                  };
                  return newMessages;
                });
              }
            } catch {
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateImage = async () => {
    if (!imagePrompt.trim()) return;
    setIsGeneratingImage(true);

    try {
      const response = await fetch(`/api/agents/${agent.id}/generate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: imagePrompt }),
      });

      if (!response.ok) throw new Error("Failed to generate image");

      const data = await response.json();
      if (data.imageUrl) {
        setGeneratedImages((prev) => [{ url: data.imageUrl, prompt: imagePrompt }, ...prev]);
        setImagePrompt("");
        toast({ title: "Image generated successfully!" });
      }
    } catch (error) {
      toast({ title: "Failed to generate image", variant: "destructive" });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const performWebSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults(null);

    try {
      const response = await fetch(`/api/agents/${agent.id}/web-search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (!response.ok) throw new Error("Search failed");

      const data = await response.json();
      setSearchResults(data.results);
    } catch (error) {
      toast({ title: "Search failed", variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  };

  const analyzeDocument = async () => {
    if (!uploadedFile) {
      toast({ title: "Please upload a document first", variant: "destructive" });
      return;
    }
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string)?.split(",")[1];
        
        const response = await fetch(`/api/agents/${agent.id}/analyze-document`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            imageBase64: base64,
            mimeType: uploadedFile.type,
            question: documentQuestion || "Please analyze this document and provide a summary."
          }),
        });

        if (!response.ok) throw new Error("Analysis failed");

        const data = await response.json();
        setAnalysisResult(data.analysis);
        setIsAnalyzing(false);
      };
      reader.readAsDataURL(uploadedFile);
    } catch (error) {
      toast({ title: "Analysis failed", variant: "destructive" });
      setIsAnalyzing(false);
    }
  };

  const createTask = async () => {
    if (!newTaskName.trim()) return;

    try {
      await apiRequest("POST", `/api/agents/${agent.id}/tasks`, {
          name: newTaskName,
          description: newTaskDescription,
          taskType: newTaskType,
          schedule: "once",
      });
      
      setNewTaskName("");
      setNewTaskDescription("");
      queryClient.invalidateQueries({ queryKey: [`/api/agents/${agent.id}/tasks`] });
      toast({ title: "Task created successfully!" });
    } catch (error) {
      toast({ title: "Failed to create task", variant: "destructive" });
    }
  };

  const executeTask = async (taskId: string) => {
    try {
      await apiRequest("POST", `/api/agents/${agent.id}/tasks/${taskId}/execute`);
      
      queryClient.invalidateQueries({ queryKey: [`/api/agents/${agent.id}/tasks`] });
      toast({ title: "Task executed successfully!" });
    } catch (error) {
      toast({ title: "Failed to execute task", variant: "destructive" });
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await apiRequest("DELETE", `/api/agents/${agent.id}/tasks/${taskId}`);
      queryClient.invalidateQueries({ queryKey: [`/api/agents/${agent.id}/tasks`] });
      toast({ title: "Task deleted" });
    } catch (error) {
      toast({ title: "Failed to delete task", variant: "destructive" });
    }
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm flex flex-col">
      <CardHeader className="pb-3 border-b border-border/50">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          {agent.name} Capabilities
        </CardTitle>
        <CardDescription>Chat, generate images, analyze documents, search, and automate tasks</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid grid-cols-5 m-4 mb-0">
            <TabsTrigger value="chat" className="flex items-center gap-1" data-testid="tab-chat">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">{t("chat.chat")}</span>
            </TabsTrigger>
            <TabsTrigger value="image" className="flex items-center gap-1" data-testid="tab-image">
              <Image className="h-4 w-4" />
              <span className="hidden sm:inline">{t("chat.imageGen")}</span>
            </TabsTrigger>
            <TabsTrigger value="document" className="flex items-center gap-1" data-testid="tab-document">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">{t("chat.docs")}</span>
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-1" data-testid="tab-search">
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">{t("chat.search")}</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-1" data-testid="tab-tasks">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">{t("chat.tasks")}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex-1 flex flex-col m-0 h-[400px]">
            <ScrollArea ref={scrollRef} className="flex-1 p-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-8">
                  <Bot className="h-12 w-12 mb-4 text-primary/50" />
                  <p className="text-lg font-medium">Start a conversation</p>
                  <p className="text-sm mt-1">
                    Ask {agent.name} about {agent.capabilities.slice(0, 2).join(", ")}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                    >
                      <Avatar className="h-8 w-8 shrink-0">
                        {msg.role === "assistant" ? (
                          <>
                            <AvatarImage src={agent.imageUrl} />
                            <AvatarFallback>
                              <Bot className="h-4 w-4" />
                            </AvatarFallback>
                          </>
                        ) : (
                          <AvatarFallback>
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  {isLoading && messages[messages.length - 1]?.content === "" && (
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={agent.imageUrl} />
                        <AvatarFallback>
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-muted rounded-lg px-4 py-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            <div className="p-4 border-t border-border/50">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t("chat.placeholder", { name: agent.name })}
                  disabled={isLoading}
                  className="flex-1"
                  data-testid="input-agent-chat"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isLoading}
                  data-testid="button-send-message"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="image" className="flex-1 m-0 p-4 space-y-4 overflow-auto">
            <div className="space-y-2">
              <h3 className="font-medium">{t("chat.generateImage")}</h3>
              <p className="text-sm text-muted-foreground">Create AI-generated images with {agent.name}'s style</p>
              <div className="flex gap-2">
                <Input
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder={t("chat.generateImagePlaceholder")}
                  disabled={isGeneratingImage}
                  data-testid="input-image-prompt"
                />
                <Button 
                  onClick={generateImage} 
                  disabled={!imagePrompt.trim() || isGeneratingImage}
                  data-testid="button-generate-image"
                >
                  {isGeneratingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Image className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            {generatedImages.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Generated Images</h4>
                <div className="grid grid-cols-2 gap-2">
                  {generatedImages.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img 
                        src={img.url} 
                        alt={img.prompt} 
                        className="w-full h-32 object-cover rounded-lg border border-border"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center p-2">
                        <p className="text-xs text-white text-center line-clamp-3">{img.prompt}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="document" className="flex-1 m-0 p-4 space-y-4 overflow-auto">
            <div className="space-y-2">
              <h3 className="font-medium">{t("chat.analyzeDoc")}</h3>
              <p className="text-sm text-muted-foreground">Upload images or documents for {agent.name} to analyze</p>
              
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="file-upload"
                  data-testid="input-file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  {uploadedFile ? (
                    <p className="text-sm font-medium">{uploadedFile.name}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Click to upload an image or document</p>
                  )}
                </label>
              </div>

              <Textarea
                value={documentQuestion}
                onChange={(e) => setDocumentQuestion(e.target.value)}
                placeholder={t("chat.analyzeDocPlaceholder")}
                className="resize-none"
                data-testid="input-document-question"
              />
              
              <Button 
                onClick={analyzeDocument} 
                disabled={!uploadedFile || isAnalyzing}
                className="w-full"
                data-testid="button-analyze-document"
              >
                {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                {isAnalyzing ? t("chat.analyzing") : t("chat.analyzeDoc")}
              </Button>
            </div>

            {analysisResult && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Analysis Result</h4>
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm whitespace-pre-wrap">{analysisResult}</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="search" className="flex-1 m-0 p-4 space-y-4 overflow-auto">
            <div className="space-y-2">
              <h3 className="font-medium">{t("chat.webSearch")}</h3>
              <p className="text-sm text-muted-foreground">Let {agent.name} research topics for you</p>
              <div className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("chat.webSearchPlaceholder")}
                  disabled={isSearching}
                  data-testid="input-search-query"
                />
                <Button 
                  onClick={performWebSearch} 
                  disabled={!searchQuery.trim() || isSearching}
                  data-testid="button-web-search"
                >
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {searchResults && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Research Results</h4>
                <div className="bg-muted rounded-lg p-4 max-h-[300px] overflow-auto">
                  <p className="text-sm whitespace-pre-wrap">{searchResults}</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="tasks" className="flex-1 m-0 p-4 space-y-4 overflow-auto">
            <div className="space-y-2">
              <h3 className="font-medium">{t("chat.createTask")}</h3>
              <p className="text-sm text-muted-foreground">Create automated tasks for {agent.name}</p>
              
              <Input
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                placeholder={t("chat.taskTitle")}
                data-testid="input-task-name"
              />
              <Textarea
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                placeholder={t("chat.taskDescription")}
                className="resize-none"
                data-testid="input-task-description"
              />
              <div className="flex gap-2">
                <select
                  value={newTaskType}
                  onChange={(e) => setNewTaskType(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  data-testid="select-task-type"
                >
                  <option value="report">Report Generation</option>
                  <option value="analysis">Data Analysis</option>
                  <option value="alert">Alert/Notification</option>
                  <option value="automation">Automation</option>
                </select>
                <Button onClick={createTask} disabled={!newTaskName.trim()} data-testid="button-create-task">
                  <Plus className="h-4 w-4 mr-1" />
                  {t("chat.createTask")}
                </Button>
              </div>
            </div>

            {tasks.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Your Tasks</h4>
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <div 
                      key={task.id} 
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{task.name}</p>
                          <Badge variant="secondary" className="text-xs">{task.taskType}</Badge>
                        </div>
                        {task.description && (
                          <p className="text-xs text-muted-foreground truncate">{task.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => executeTask(task.id)}
                          data-testid={`button-execute-task-${task.id}`}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => deleteTask(task.id)}
                          data-testid={`button-delete-task-${task.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
