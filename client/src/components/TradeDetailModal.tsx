import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trade } from "./TradesTable";
import { ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Pencil, Trash2, X } from "lucide-react";
import ConfluenceTag from "./ConfluenceTag";

interface TradeDetailModalProps {
  trade: Trade | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (trade: Trade) => void;
  onDelete?: (id: string) => void;
}

export default function TradeDetailModal({
  trade,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: TradeDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showFullImage, setShowFullImage] = useState(false);

  useEffect(() => {
    setCurrentImageIndex(0);
    setShowFullImage(false);
  }, [trade?.id]);

  if (!trade) return null;

  const getResultBadge = (result: Trade["result"]) => {
    switch (result) {
      case "target":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Target</Badge>;
      case "stop_loss":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Stop Loss</Badge>;
      case "breakeven":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Breakeven</Badge>;
      case "parziale":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Parziale</Badge>;
      case "non_fillato":
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Non Fillato</Badge>;
    }
  };

  const calculateResultPercent = () => {
    if (trade.result === "target") return `+${trade.target.toFixed(2)}%`;
    if (trade.result === "stop_loss") return `-${trade.stopLoss.toFixed(2)}%`;
    if (trade.result === "breakeven") return "0%";
    if (trade.result === "parziale") return `+${(trade.target * 0.5).toFixed(2)}%`;
    return "-";
  };

  const nextImage = () => {
    if (trade.imageUrls.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % trade.imageUrls.length);
    }
  };

  const prevImage = () => {
    if (trade.imageUrls.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + trade.imageUrls.length) % trade.imageUrls.length);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="modal-trade-detail">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span className="text-lg font-semibold">{trade.pair}</span>
              <span
                className={`inline-flex items-center gap-1 text-sm ${
                  trade.direction === "long" ? "text-emerald-500" : "text-red-500"
                }`}
              >
                {trade.direction === "long" ? (
                  <ArrowUp className="w-4 h-4" />
                ) : (
                  <ArrowDown className="w-4 h-4" />
                )}
                {trade.direction === "long" ? "Long" : "Short"}
              </span>
              {getResultBadge(trade.result)}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Data</p>
                <p className="font-mono text-sm">{trade.date}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ora</p>
                <p className="font-mono text-sm">{trade.time}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Rischio %</p>
                <p className="font-mono text-sm text-red-400">-{trade.stopLoss.toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Risultato Finale</p>
                <p
                  className={`font-mono text-sm font-medium ${
                    trade.result === "target" || trade.result === "parziale"
                      ? "text-emerald-400"
                      : trade.result === "stop_loss"
                      ? "text-red-400"
                      : "text-yellow-400"
                  }`}
                >
                  {calculateResultPercent()}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1">Emozione</p>
              <Badge variant="outline">{trade.emotion}</Badge>
            </div>

            {trade.notes && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Note</p>
                <p className="text-sm bg-muted/50 rounded-md p-3">{trade.notes}</p>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-2">Confluenze PRO</p>
                <div className="flex flex-wrap gap-1">
                  {trade.confluencesPro.length > 0 ? (
                    trade.confluencesPro.map((tag) => (
                      <ConfluenceTag key={tag} label={tag} type="pro" />
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">Nessuna</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Confluenze CONTRO</p>
                <div className="flex flex-wrap gap-1">
                  {trade.confluencesContro.length > 0 ? (
                    trade.confluencesContro.map((tag) => (
                      <ConfluenceTag key={tag} label={tag} type="contro" />
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">Nessuna</span>
                  )}
                </div>
              </div>
            </div>

            {trade.imageUrls.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Screenshot ({trade.imageUrls.length})</p>
                <div className="relative">
                  <div
                    className="relative w-full aspect-video bg-muted rounded-md overflow-hidden cursor-pointer"
                    onClick={() => setShowFullImage(true)}
                  >
                    <img
                      src={trade.imageUrls[currentImageIndex]}
                      alt={`Trade screenshot ${currentImageIndex + 1}`}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='225' viewBox='0 0 400 225'%3E%3Crect fill='%23333' width='400' height='225'/%3E%3Ctext fill='%23888' x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='14'%3EImmagine non disponibile%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  </div>
                  {trade.imageUrls.length > 1 && (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80"
                        onClick={(e) => { e.stopPropagation(); prevImage(); }}
                        data-testid="button-prev-image"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80"
                        onClick={(e) => { e.stopPropagation(); nextImage(); }}
                        data-testid="button-next-image"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
                {trade.imageUrls.length > 1 && (
                  <div className="flex gap-2 mt-2 justify-center">
                    {trade.imageUrls.map((url, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-12 h-12 rounded-md overflow-hidden border-2 transition-colors ${
                          index === currentImageIndex ? "border-primary" : "border-transparent"
                        }`}
                        data-testid={`button-thumbnail-${index}`}
                      >
                        <img
                          src={url}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Crect fill='%23333' width='48' height='48'/%3E%3C/svg%3E";
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit?.(trade)}
                data-testid="button-edit-trade-modal"
              >
                <Pencil className="w-4 h-4 mr-2" />
                Modifica
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-500"
                onClick={() => {
                  onDelete?.(trade.id);
                  onOpenChange(false);
                }}
                data-testid="button-delete-trade-modal"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Rimuovi
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showFullImage} onOpenChange={setShowFullImage}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-transparent border-none">
          <div className="relative w-full h-full flex items-center justify-center">
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-2 right-2 bg-background/80 z-10"
              onClick={() => setShowFullImage(false)}
            >
              <X className="w-4 h-4" />
            </Button>
            {trade.imageUrls.length > 1 && (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 z-10"
                  onClick={prevImage}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 z-10"
                  onClick={nextImage}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </>
            )}
            <img
              src={trade.imageUrls[currentImageIndex]}
              alt={`Trade screenshot ${currentImageIndex + 1}`}
              className="max-w-full max-h-[90vh] object-contain rounded-md"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
