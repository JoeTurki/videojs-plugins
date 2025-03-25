import videojs from 'video.js';
import { Player, WSController, HTTPConnector } from '@ceeblue/webrtc-client';
import { WebRTCTracksController } from '../controllers/WebRTCTracksController';
import type Tech from 'video.js/dist/types/tech/tech';
import type { VideojsSourceObject, VideojsWebRTCSourceObject } from './sources';
const Component = videojs.getComponent('Component');

export type WebRTCSourceOptions = {
  readonly playerId: string;
}

/**
 * An advanced Video.js plugin for playing WebRTC stream from Ceeblue cloud.
 *
 */
export class WebRTCSource extends Component {
  /**
   * The WebRTC player instance.
   * Destroyed when the source is disposed.
   */
  webRTCPlayer?: Player | void;

  /**
   * The source object.
   */
  private readonly _source: VideojsSourceObject;

  /**
   * The tracks controller instance.
   */
  private _tracksController?: WebRTCTracksController | void;

  /**
   * Abort controller to stop the WebRTC player.
   */
  private _abortController?: AbortController | void;

  /**
   * Video.js tech object.
   */
  private _tech: Tech;

  /**
   * Create a WebRTC source handler instance.
   *
   * @param Source object that is given in the DOM, includes the stream URL
   *  and the source options : {iceserver: string|Object, audiobutton: true|false, data: true|false}
   * @param tech The videojs tech object
   * @param options The videojs options object
   */
  constructor(source: VideojsWebRTCSourceObject, tech: Tech, options: WebRTCSourceOptions) {
    super(tech.player());

    this._source = source;
    this._tech = tech;

    // Check RTCPPeerConnection support
    if (!window.RTCPeerConnection) {
      this.player().error('WebRTC is not supported by this browser');

      return;
    }

    if (typeof source.src !== 'string') {
      this.player().error('Invalid WebRTC source');

      return;
    }

    this._abortController = new AbortController();
    this.webRTCPlayer = new Player(source.src.startsWith('http') ? HTTPConnector : WSController);
    this.webRTCPlayer.on('start', this._handleStart.bind(this), this._abortController);
    this.webRTCPlayer.on('stop', this._handleStop.bind(this), this._abortController);
    // @ts-expect-error - metadata is not defined on Player.
    this.webRTCPlayer.onError = this._onError;
    this.webRTCPlayer.start({
      endPoint: source.src,
      streamName: '',
      iceServer: source?.iceServers?.[0] ?? this.defaultICEServer(source.src),
    });

    // Create the tracks controller
    this._tracksController = new WebRTCTracksController(this);
  }

  /**
   * Return the default ice server for Ceeblue Edge.
   * This is used if ICE servers aren't explicitly provided.
   */
  defaultICEServer(src: string): RTCIceServer {
    const url = new URL(src);

    return {
      urls: ['turn:' + url.hostname + ':3478?transport=tcp', 'turn:' + url.hostname + ':3478'],
      username: 'ceeblue',
      credential: 'ceeblue',
    };
  }

  /**
   * Handle webRTCPlayer start event.
   */
  _handleStart(stream: MediaProvider) {
    console.log(this.player);
    const vid = this._tech?.el?.() as HTMLVideoElement;

    if (vid.srcObject !== stream) {
      vid.srcObject = stream;
    }

    this.player().trigger('play');
  }

  /**
   * Handle webRTCPlayer stop event.
   */
  _handleStop() {
    this.player().trigger('ended');
  }

  /**
   * Handle webRTCPlayer playing event.
   */
  _handlePlaying(playing: boolean) { }

  /**
   * Handle webRTCPlayer metadata event.
   */
  _handleMetadata(metadata: unknown) {
    this._tracksController?.update(metadata);
  }

  /**
   * Handle webRTCPlayer error event.
   */
  _onError(error: unknown) {
    videojs.log.error(error);
    if (error === 'Stream is offline') {
      // Trigger onended event
      this.player().trigger('ended');
    }
  }

  /**
   * Dispose the WebRTC source handler instance.
   */
  dispose() {
    if (this.webRTCPlayer) {
      this._abortController?.abort();
      this.webRTCPlayer?.stop();
      delete this.webRTCPlayer;
    }

    if (this._tracksController) {
      this._tracksController.reset();
      delete this._tracksController;
    }

    super.dispose();
  }
}
