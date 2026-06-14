extern crate dsp;
extern crate lv2;
use dsp::{EnvelopeFollower, Params, TrackingMode};
use lv2::prelude::*;

const CV_RANGE: f32 = 10.;

#[derive(PortCollection)]
struct Ports {
  gain: InputPort<InPlaceControl>,
  mode: InputPort<InPlaceControl>,
  rise_factor: InputPort<InPlaceControl>,
  fall_factor: InputPort<InPlaceControl>,
  invert_cv_output: InputPort<InPlaceControl>,
  audio_input: InputPort<InPlaceAudio>,
  cv_output: OutputPort<InPlaceCV>,
  scope_input: OutputPort<InPlaceControl>,
}

#[uri("https://github.com/davemollen/dm-EnvelopeFollower")]
struct DmEnvelopeFollower {
  envelope_follower: EnvelopeFollower,
  params: Params,
}

impl Plugin for DmEnvelopeFollower {
  // Tell the framework which ports this plugin has.
  type Ports = Ports;

  // We don't need any special host features; We can leave them out.
  type InitFeatures = ();
  type AudioFeatures = ();

  // Create a new instance of the plugin; Trivial in this case.
  fn new(plugin_info: &PluginInfo, _features: &mut ()) -> Option<Self> {
    let sample_rate = plugin_info.sample_rate() as f32;

    Some(Self {
      envelope_follower: EnvelopeFollower::new(),
      params: Params::new(sample_rate),
    })
  }

  /// Reset the internal state of the plugin.
  fn activate(&mut self, _features: &mut Self::InitFeatures) {
    self.envelope_follower.reset();
  }

  // Process a chunk of audio. The audio ports are dereferenced to slices, which the plugin
  // iterates over.
  fn run(&mut self, ports: &mut Ports, _features: &mut (), _sample_count: u32) {
    self.params.set(
      ports.gain.get(),
      if ports.mode.get() == 0. {
        TrackingMode::Peak
      } else {
        TrackingMode::RMS
      },
      ports.rise_factor.get(),
      ports.fall_factor.get(),
      ports.invert_cv_output.get() == 1.,
    );

    for (audio_input, cv_output) in ports.audio_input.iter().zip(ports.cv_output.iter()) {
      let envelope = self
        .envelope_follower
        .process(audio_input.get(), &mut self.params);
      cv_output.set(envelope * CV_RANGE);
      ports.scope_input.set(envelope);
    }
  }
}

// Generate the plugin descriptor function which exports the plugin to the outside world.
lv2_descriptors!(DmEnvelopeFollower);
