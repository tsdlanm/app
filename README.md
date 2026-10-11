# app

A command-line tool written in Go with [Cobra](https://github.com/spf13/cobra).

## Requirements

- Go 1.24+

## Usage

```sh
make build        # build to bin/app
./bin/app --help
./bin/app version
make test         # run tests
make run ARGS="version"
```

## Project layout

```
.
├── main.go         # entry point
└── cmd/
    ├── root.go     # root command and global flags
    └── version.go  # `app version` subcommand
```

## Adding a command

Create a file in `cmd/` that defines a `*cobra.Command` and registers it in `init()`:

```go
var helloCmd = &cobra.Command{
	Use:   "hello",
	Short: "Say hello",
	RunE: func(cmd *cobra.Command, args []string) error {
		fmt.Fprintln(cmd.OutOrStdout(), "hello")
		return nil
	},
}

func init() {
	rootCmd.AddCommand(helloCmd)
}
```
