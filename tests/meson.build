gjs = find_program('gjs')

test('helpers',
  gjs,
  args: ['-m', join_paths(meson.current_source_dir(), 'run.js')],
  timeout: 60,
)
