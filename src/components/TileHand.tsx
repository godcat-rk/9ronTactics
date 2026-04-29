import type { Tile } from '../types/game';
import { ALL_TILES, isOdd } from '../lib/gameLogic';

interface Props {
  usedTiles: Tile[];
  selectedTile: Tile | null;
  submitted: boolean;
  onSelect: (tile: Tile) => void;
}

export function TileHand({ usedTiles, selectedTile, submitted, onSelect }: Props) {
  return (
    <div className="flex flex-col items-center gap-4">
      <p
        style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 11,
          letterSpacing: '0.3em',
          color: '#5C4008',
          textTransform: 'uppercase',
        }}
      >
        Your Tiles
      </p>
      <div className="flex gap-2.5 flex-wrap justify-center">
        {ALL_TILES.map((tile) => {
          const used = usedTiles.includes(tile);
          const selected = selectedTile === tile;
          const odd = isOdd(tile);

          const baseColor  = odd ? '#C84040' : '#3EA878';
          const borderNorm = odd ? '#4A1818' : '#1A4A34';
          const borderSel  = odd ? '#C41830' : '#2A7055';
          const bgColor    = odd ? '#120808' : '#080F0C';

          return (
            <button
              key={tile}
              onClick={() => !used && !submitted && onSelect(tile)}
              className={`tile flex flex-col items-center justify-center font-bold relative
                ${used ? 'tile-used' : ''}
                ${selected ? 'tile-selected' : ''}
              `}
              style={{
                width: 52,
                height: 72,
                background: bgColor,
                border: selected
                  ? `2px solid ${borderSel}`
                  : `1px solid ${borderNorm}`,
                boxShadow: selected
                  ? `0 0 16px ${borderSel}99, inset 0 0 10px ${borderSel}22`
                  : 'none',
                color: baseColor,
                fontFamily: "'Noto Serif JP', serif",
              }}
            >
              <span style={{ fontSize: 26, fontWeight: 700, lineHeight: 1 }}>{tile}</span>
              {tile === 1 && (
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    right: 3,
                    fontSize: 9,
                    color: '#C89614',
                    textShadow: '0 0 6px rgba(200,150,20,0.8)',
                  }}
                >
                  ★
                </span>
              )}
            </button>
          );
        })}
      </div>
      {submitted && (
        <p
          className="animate-pulse-neon"
          style={{
            fontFamily: "'Noto Serif JP', serif",
            fontSize: 14,
            color: '#C89614',
            letterSpacing: '0.1em',
          }}
        >
          待機中… 相手の選択を待っています
        </p>
      )}
    </div>
  );
}
