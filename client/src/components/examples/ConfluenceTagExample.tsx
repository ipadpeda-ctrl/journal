import ConfluenceTag from "../ConfluenceTag";

export default function ConfluenceTagExample() {
  return (
    <div className="flex flex-wrap gap-2">
      <ConfluenceTag label="Trend forte" type="pro" onRemove={() => console.log("Removed")} />
      <ConfluenceTag label="Supporto testato" type="pro" onRemove={() => console.log("Removed")} />
      <ConfluenceTag label="Volume alto" type="pro" onRemove={() => console.log("Removed")} />
      <ConfluenceTag label="Notizie in arrivo" type="contro" onRemove={() => console.log("Removed")} />
      <ConfluenceTag label="Pattern debole" type="contro" onRemove={() => console.log("Removed")} />
    </div>
  );
}
