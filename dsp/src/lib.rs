mod average;
mod params;
mod slide;
pub use {
  average::Average,
  params::{Params, TrackingMode},
  slide::Slide,
};

pub struct EnvelopeFollower {
  average: Average,
  slide: Slide,
}

impl EnvelopeFollower {
  pub fn new() -> Self {
    Self {
      average: Average::new(1000),
      slide: Slide::new(),
    }
  }

  pub fn reset(&mut self) {
    self.average.reset();
    self.slide.reset();
  }

  pub fn process(&mut self, input: f32, params: &mut Params) -> f32 {
    let Params {
      gain,
      tracking_mode,
      rise_factor,
      fall_factor,
      invert_output,
      ..
    } = *params;

    let scaled_input = input * gain;
    let amplitude = if tracking_mode == TrackingMode::Peak {
      scaled_input.abs()
    } else {
      self.average.process(scaled_input)
    };
    let envelope = self
      .slide
      .process(amplitude, rise_factor, fall_factor)
      .min(1.);
    if invert_output {
      1. - envelope
    } else {
      envelope
    }
  }
}
