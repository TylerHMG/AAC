import type { WindowType } from '../../types/window';
import { EditableGrid } from '../modules/EditableGrid';
import { AiGrid } from '../modules/AiGrid';
import { Autocomplete } from '../modules/Autocomplete';

// Maps a window type to its content component. `windowId` is passed so windows
// with per-instance config (e.g. the AI window's generate count) can read/write
// their own settings. Not-yet-built types show a labelled placeholder.
export function WindowContent({ type, windowId }: { type: WindowType; windowId: string }) {
  switch (type) {
    case 'grid':
      return <EditableGrid windowId={windowId} />;
    case 'aiGrid':
      return <AiGrid windowId={windowId} />;
    case 'autocomplete':
      return <Autocomplete windowId={windowId} />;
    default:
      return <div className="window-placeholder">{type} (coming soon)</div>;
  }
}
