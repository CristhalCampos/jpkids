import IndividualCard from './IndividualCard';

interface GroupItem {
  name: string;
  image?: string;
  stars?: number;
  onClick?: () => void;
}

interface GroupCardProps {
  title: string;
  items?: GroupItem[];
}

export default function GroupCard({ title, items = [] }: GroupCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
      <h3 className="text-base font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
        {title}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {items.map((item, index) => (
          <IndividualCard
            key={index}
            name={item.name}
            image={item.image}
            stars={item.stars}
            onClick={item.onClick}
          />
        ))}
      </div>
    </div>
  );
}