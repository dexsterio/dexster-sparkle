import React from 'react';
import { PollData } from '@/types/chat';

interface PollMessageProps {
  pollData: PollData;
  onVote: (optionIndex: number) => void;
}

const PollMessage: React.FC<PollMessageProps> = ({ pollData, onVote }) => {
  const totalVotes = pollData.options.reduce((s, o) => s + o.voters.length, 0);
  const hasVoted = pollData.options.some(o => o.voters.includes('me'));

  return (
    <div className="min-w-[260px]">
      <div className="text-sm font-semibold text-foreground mb-2">{pollData.question}</div>
      {pollData.quizMode && <div className="text-[10px] text-muted-foreground mb-2">Quiz · {pollData.multiChoice ? 'Multiple answers' : 'Single answer'}</div>}
      {!pollData.quizMode && pollData.multiChoice && <div className="text-[10px] text-muted-foreground mb-2">Multiple choice poll</div>}
      <div className="space-y-1.5">
        {pollData.options.map((opt, i) => {
          const voted = opt.voters.includes('me');
          const pct = totalVotes > 0 ? Math.round((opt.voters.length / totalVotes) * 100) : 0;
          const isCorrect = pollData.quizMode && pollData.correctOption === i;
          const isWrong = pollData.quizMode && hasVoted && voted && pollData.correctOption !== i;

          return (
            <button
              key={i}
              onClick={() => onVote(i)}
              disabled={pollData.closed}
              className={`w-full text-left rounded-lg px-3 py-2 relative overflow-hidden transition-colors ${voted ? 'border border-primary/40' : 'border border-border hover:bg-dex-hover'} ${isCorrect && hasVoted ? 'border-dex-online' : ''} ${isWrong ? 'border-destructive/50' : ''}`}
            >
              {/* Progress bar */}
              {hasVoted && (
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-500 ${isCorrect ? 'bg-dex-online/15' : isWrong ? 'bg-destructive/10' : 'bg-primary/10'}`}
                  style={{ width: `${pct}%` }}
                />
              )}
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {!hasVoted && (
                    <div className={`w-4 h-4 rounded-full border-2 ${voted ? 'border-primary bg-primary' : 'border-muted-foreground/40'} flex items-center justify-center`}>
                      {voted && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  )}
                  <span className="text-sm text-foreground">{opt.text}</span>
                  {isCorrect && hasVoted && <span className="text-xs">✅</span>}
                  {isWrong && <span className="text-xs">❌</span>}
                </div>
                {hasVoted && <span className="text-xs font-semibold text-muted-foreground">{pct}%</span>}
              </div>
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between mt-2 text-[11px] text-muted-foreground">
        <span>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
        {hasVoted && !pollData.closed && (
          <button onClick={() => onVote(-1)} className="text-primary hover:underline">Retract Vote</button>
        )}
      </div>
      {hasVoted && pollData.quizMode && pollData.explanation && (
        <div className="mt-2 p-2 rounded-lg bg-primary/[0.08] border-l-2 border-primary text-xs text-muted-foreground">
          💡 {pollData.explanation}
        </div>
      )}
    </div>
  );
};

export default PollMessage;
