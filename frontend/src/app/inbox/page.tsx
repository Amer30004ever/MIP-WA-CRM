"use client";

import { useEffect, useState, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  MessageSquare,
  Send,
  User,
  CheckCircle,
  Inbox,
  Search,
  Check,
  CheckCheck,
  UserCheck,
  AlertCircle,
  Loader2,
  Phone,
  Clock,
  Sparkles,
} from "lucide-react";

interface Contact {
  id: string;
  phone: string;
  name: string | null;
}

interface Conversation {
  id: string;
  unreadCount: number;
  status: "OPEN" | "RESOLVED";
  lastMessageAt: string;
  lastMessagePreview: string;
  assignedToId: string | null;
  contact: Contact;
}

interface Message {
  id: string;
  waMessageId: string | null;
  direction: "INBOUND" | "OUTBOUND";
  type: "TEXT" | "IMAGE" | "AUDIO" | "VIDEO" | "DOCUMENT" | "TEMPLATE";
  content: string;
  mediaUrl: string | null;
  timestamp: string;
  isRead: boolean;
}

export default function InboxPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"All" | "Unread" | "Assigned" | "Resolved">("All");
  
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingConvs, setIsLoadingConvs] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // 1. Fetch conversations list
  const fetchConversations = async (silent = false) => {
    try {
      if (!silent) setIsLoadingConvs(true);
      const res = await api.get<{ data: Conversation[] }>("/conversations");
      setConversations(res.data.data);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setIsLoadingConvs(false);
    }
  };

  // 2. Fetch messages for selected conversation
  const fetchMessages = async (convId: string, silent = false) => {
    try {
      if (!silent) setIsLoadingMessages(true);
      const res = await api.get<{ data: Message[] }>(`/conversations/${convId}/messages`);
      // Sort messages by timestamp ascending
      const sorted = res.data.data.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      setMessages(sorted);
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchConversations();
  }, []);

  // Poll conversations & selected thread messages every 3 seconds for real-time experience
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations(true);
      if (selectedConversation) {
        fetchMessages(selectedConversation.id, true);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedConversation]);

  // When a new conversation is selected, fetch messages immediately
  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    fetchMessages(conv.id);
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 3. Send Text Reply
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversation || !replyText.trim() || isSending) return;

    setIsSending(true);
    const content = replyText.trim();
    setReplyText("");

    try {
      const res = await api.post<Message>(`/conversations/${selectedConversation.id}/messages/text`, {
        content,
      });
      // Append message instantly in UI for instant perception
      setMessages((prev) => [...prev, res.data]);
      // Instantly refresh conversation status locally to reflect latest preview
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConversation.id
            ? { ...c, lastMessagePreview: content, unreadCount: 0, lastMessageAt: new Date().toISOString() }
            : c
        )
      );
    } catch (err) {
      console.error("Failed to send message:", err);
      alert("Failed to send message. Please check the backend connection.");
    } finally {
      setIsSending(false);
    }
  };

  // 4. Assign to self
  const handleAssignToSelf = async () => {
    if (!selectedConversation || !user) return;
    try {
      const res = await api.patch<Conversation>(`/conversations/${selectedConversation.id}/assign`, {
        userId: user.id,
      });
      setSelectedConversation(res.data);
      fetchConversations(true);
    } catch (err) {
      console.error("Failed to assign conversation:", err);
    }
  };

  // 5. Toggle Resolution status
  const handleToggleStatus = async () => {
    if (!selectedConversation) return;
    const targetStatus = selectedConversation.status === "OPEN" ? "RESOLVED" : "OPEN";
    try {
      const res = await api.patch<Conversation>(`/conversations/${selectedConversation.id}/status`, {
        status: targetStatus,
      });
      setSelectedConversation(res.data);
      fetchConversations(true);
    } catch (err) {
      console.error("Failed to toggle status:", err);
    }
  };

  // Filter & Search Logic
  const filteredConversations = conversations.filter((c) => {
    // Search filter
    const matchesSearch =
      c.contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contact.phone.includes(searchQuery);

    if (!matchesSearch) return false;

    // Category Filter
    if (activeFilter === "Unread") return c.unreadCount > 0;
    if (activeFilter === "Assigned") return c.assignedToId === user?.id;
    if (activeFilter === "Resolved") return c.status === "RESOLVED";
    return c.status === "OPEN"; // By default show OPEN for "All"
  });

  return (
    <AppLayout>
      <PageHeader
        title="Inbox"
        description="Interact with clients in real-time and review ongoing WhatsApp conversation threads"
      />

      <div className="flex h-[calc(100vh-11rem)] overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
        
        {/* CONVERSATION LIST SIDEBAR */}
        <div className="flex w-80 shrink-0 flex-col border-r border-border bg-background/50">
          
          {/* Search bar */}
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                id="inbox-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search phone or name…"
                className="w-full rounded-xl border border-input bg-background pl-9 pr-4 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary focus:ring-offset-0"
              />
            </div>
          </div>

          {/* Filter Categories */}
          <div className="flex border-b border-border px-2">
            {(["All", "Unread", "Assigned", "Resolved"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`flex-1 pb-3 pt-2 text-xs font-semibold border-b-2 transition-all ${
                  activeFilter === filter
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* List Items */}
          <div className="flex-1 overflow-y-auto">
            {isLoadingConvs && conversations.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">Loading chats…</span>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center p-6 text-center">
                <Inbox className="h-8 w-8 text-muted-foreground/60 mb-2" />
                <h4 className="text-sm font-semibold text-foreground">No conversations found</h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                  {searchQuery ? "Try searching for something else." : "Chats matching this filter will show up here."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {filteredConversations.map((conv) => {
                  const isSelected = selectedConversation?.id === conv.id;
                  const formattedTime = new Date(conv.lastMessageAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv)}
                      className={`w-full text-left p-4 transition-all flex gap-3 items-start border-l-4 ${
                        isSelected
                          ? "bg-primary/5 border-primary"
                          : "border-transparent hover:bg-muted/40"
                      }`}
                    >
                      {/* Avatar */}
                      <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-sm font-semibold uppercase ${
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                      }`}>
                        {conv.contact.name ? conv.contact.name.substring(0, 2) : "WA"}
                      </div>

                      {/* Chat Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-sm truncate text-foreground">
                            {conv.contact.name || conv.contact.phone}
                          </h4>
                          <span className="text-[10px] text-muted-foreground font-medium shrink-0 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {formattedTime}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mb-1">
                          {conv.lastMessagePreview || "No messages yet"}
                        </p>
                        
                        {/* Tags / Badges */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1.5">
                            {conv.assignedToId ? (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-blue-500/10 text-blue-500">
                                <UserCheck className="h-2.5 w-2.5" /> Assigned
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-amber-500/10 text-amber-500">
                                <AlertCircle className="h-2.5 w-2.5" /> Unassigned
                              </span>
                            )}
                            
                            {conv.status === "RESOLVED" && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-emerald-500/10 text-emerald-500">
                                <CheckCircle className="h-2.5 w-2.5" /> Resolved
                              </span>
                            )}
                          </div>

                          {/* Unread dot */}
                          {conv.unreadCount > 0 && (
                            <span className="h-5 min-w-5 px-1.5 rounded-full bg-emerald-500 text-white font-bold text-[10px] flex items-center justify-center animate-pulse">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* THREAD CONTAINER */}
        <div className="flex flex-1 flex-col bg-background">
          {selectedConversation ? (
            <>
              {/* Thread Header */}
              <div className="h-16 shrink-0 border-b border-border px-6 flex items-center justify-between bg-card">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                    {selectedConversation.contact.name ? selectedConversation.contact.name.substring(0, 2).toUpperCase() : "WA"}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {selectedConversation.contact.name || selectedConversation.contact.phone}
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {selectedConversation.contact.phone}
                    </p>
                  </div>
                </div>

                {/* Control Actions */}
                <div className="flex items-center gap-2">
                  {/* Assign to self button */}
                  {!selectedConversation.assignedToId && (
                    <button
                      onClick={handleAssignToSelf}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground transition-all"
                    >
                      <User className="h-3.5 w-3.5" /> Claim Chat
                    </button>
                  )}
                  {/* Resolve/Reopen button */}
                  <button
                    onClick={handleToggleStatus}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      selectedConversation.status === "OPEN"
                        ? "bg-emerald-500 hover:bg-emerald-500/90 text-white"
                        : "bg-amber-500 hover:bg-amber-500/90 text-white"
                    }`}
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    {selectedConversation.status === "OPEN" ? "Mark Resolved" : "Re-open Thread"}
                  </button>
                </div>
              </div>

              {/* Message History Bubble Feed */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-muted/20">
                {isLoadingMessages && messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center flex-col text-muted-foreground gap-2">
                    <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
                    <span className="text-xs">No messages yet. Say hello to get started!</span>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isInbound = msg.direction === "INBOUND";
                    const msgTime = new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <div
                        key={msg.id}
                        className={`flex w-full ${isInbound ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm text-sm relative group ${
                            isInbound
                              ? "bg-card border border-border text-foreground rounded-tl-none"
                              : "bg-emerald-600 text-white rounded-tr-none"
                          }`}
                        >
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          
                          {/* Message meta/timestamp */}
                          <div className="flex items-center justify-end gap-1 mt-1 text-[10px] opacity-70">
                            <span>{msgTime}</span>
                            {!isInbound && (
                              <span>
                                {msg.isRead ? (
                                  <CheckCheck className="h-3 w-3 text-emerald-300 font-bold" />
                                ) : (
                                  <Check className="h-3 w-3 text-white/70" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Composer Footer Input */}
              <form onSubmit={handleSendMessage} className="border-t border-border p-4 bg-card">
                <div className="flex items-center gap-3">
                  <input
                    id="inbox-composer"
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your WhatsApp reply message…"
                    className="flex-1 rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    id="inbox-send"
                    type="submit"
                    disabled={isSending || !replyText.trim()}
                    className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center gap-1.5"
                  >
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4" /> Send
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center bg-muted/10">
              <EmptyState
                icon={<MessageSquare className="h-10 w-10 text-primary" />}
                title="No conversation selected"
                description="Select any active customer chat thread from the left menu sidebar to start chatting"
              />
            </div>
          )}
        </div>

        {/* CUSTOMER DETAILS SIDE PANEL */}
        {selectedConversation && (
          <div className="hidden w-72 shrink-0 border-l border-border bg-card p-6 xl:flex flex-col gap-6">
            <div>
              <h3 className="text-sm font-bold text-foreground mb-4">Client WhatsApp Profile</h3>
              
              <div className="flex flex-col items-center text-center gap-2 mb-6">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary uppercase shadow-sm">
                  {selectedConversation.contact.name ? selectedConversation.contact.name.substring(0, 2) : "WA"}
                </div>
                <div>
                  <h4 className="font-semibold text-base text-foreground">
                    {selectedConversation.contact.name || "WhatsApp Client"}
                  </h4>
                  <p className="text-xs text-muted-foreground">{selectedConversation.contact.phone}</p>
                </div>
              </div>

              {/* Meta stats */}
              <div className="space-y-3 border-t border-b border-border/60 py-4">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Thread Status</span>
                  <span className={`font-semibold ${selectedConversation.status === "OPEN" ? "text-amber-500" : "text-emerald-500"}`}>
                    {selectedConversation.status}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Assigned Owner</span>
                  <span className="font-semibold text-foreground">
                    {selectedConversation.assignedToId ? "You (Agent)" : "Unassigned"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick action tools */}
            <div className="flex-1">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-primary animate-pulse" /> CRM Integration Shortcuts
              </h4>
              <div className="space-y-2">
                <button
                  onClick={() => window.location.href = `/contacts?create=${selectedConversation.contact.phone}`}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold border border-border bg-background hover:bg-muted/40 text-foreground transition-all flex items-center justify-between"
                >
                  <span>Link to CRM Contact</span>
                  <span className="text-primary font-bold">→</span>
                </button>
                <button
                  onClick={() => window.location.href = `/leads?create=${selectedConversation.contact.phone}`}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold border border-border bg-background hover:bg-muted/40 text-foreground transition-all flex items-center justify-between"
                >
                  <span>Create Direct Sales Lead</span>
                  <span className="text-primary font-bold">→</span>
                </button>
              </div>
            </div>

            <div className="text-[10px] text-muted-foreground text-center border-t border-border/40 pt-4">
              Real-time communications verified under Meta Cloud SDK.
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
