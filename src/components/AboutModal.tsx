import { Modal } from './Modal';

// Plain-language "about the project" — the thesis + main features, distilled from
// the build spec (aac-capabilities-spec.md §1).
export function AboutModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="About Modular AAC" onClose={onClose}>
      <div className="about">
        <p className="about__lead">
          A free, web-based communication tool built around a <strong>composable module system</strong>{' '}
          instead of fixed boards. The headline feature is AI-generated vocabulary grids — but the
          deeper bet is that a board assembled from interchangeable windows can be flexible{' '}
          <em>and</em> stable at the same time, fixing the rigidity that plagues existing AAC tools.
        </p>

        <h3 className="about__heading">The idea</h3>
        <p>
          Most AAC grids are rigid in two ways: the layout is vendor-locked, and changing context
          means digging through deep folder trees. Here, a board is a set of windows you arrange
          yourself, and context changes happen <strong>in place</strong> — a window swaps its words
          rather than sending you down a menu.
        </p>
        <p>
          Rigidity isn’t all bad: many people navigate by muscle memory, so consistency is a
          feature. So windows come in two kinds:
        </p>
        <ul className="about__list">
          <li>
            <strong>Anchored</strong> — fixed in place (your core words), so your hand always knows
            where to reach.
          </li>
          <li>
            <strong>Dynamic</strong> — the content swaps inside a window that stays put (AI words,
            prediction, topic grids).
          </li>
        </ul>

        <h3 className="about__heading">What’s inside</h3>
        <ul className="about__list">
          <li>
            <strong>AI word suggestions</strong> — describe a situation, get words for that moment.
          </li>
          <li>
            <strong>Word prediction</strong> that learns your vocabulary, on-device.
          </li>
          <li>
            <strong>Customizable grids</strong> — your own words, shown as symbols (ARASAAC) or text,
            colour-coded by word type.
          </li>
          <li>
            <strong>A window library &amp; multiple boards</strong> — premade topic grids plus the
            windows you save and favorite.
          </li>
          <li>
            <strong>Speech you control</strong> — voice, speed, pitch, and volume.
          </li>
          <li>
            <strong>Works offline</strong> — installable to your device, and everything stays there.
          </li>
        </ul>

        <p className="about__privacy">
          Private by design: your boards and words never leave this device. The optional AI feature
          sends only the situation you type.
        </p>
        <p className="about__credit">
          Pictograms by ARASAAC (CC BY-NC-SA). App code is open source under the MIT license.
        </p>
      </div>
    </Modal>
  );
}
