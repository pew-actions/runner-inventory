import * as core from '@actions/core'
import { Octokit } from '@octokit/action'
import { RequestError } from '@octokit/request-error'

async function run(): Promise<void> {

  const organization = core.getInput('organization')
  if (!organization) {
    core.setFailed('No organization passed to the action')
    return
  }

  const token = core.getInput('token')
  if (!token) {
    core.setFailed('No access token passed to the action')
    return
  }

  const octokit = new Octokit({
    auth: token,
  })

  try {
    // Query runner groups
    const { data } = await octokit.request(
        `GET https://api.github.com/orgs/${organization}/actions/runner-groups`
    )

    for ( let group of data.runner_groups ) {
      if ( group.default ) {

        // Fetch runners in the group
        const runnersUrl = group.runners_url;
        const { data } = await octokit.request(
            `GET ${ runnersUrl }`
        )

        // Group runners by OS
        var runnersByOS = {}
        for ( let runner of data.runners ) {
          const osName = runner.os.toLowerCase()

          var runnerList = runnersByOS[osName] || []
          runnerList.push( runner.name )
          runnersByOS[osName] = runnerList
        }

        core.setOutput( 'windows', JSON.stringify( runnersByOS['windows'] ) )
        core.setOutput( 'linux', JSON.stringify( runnersByOS['linux'] ) )
        core.setOutput( 'mac', JSON.stringify( runnersByOS['mac'] ) )
      }
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      const error = err as Error;
      core.setFailed(error.message);
    } else {
      throw(err)
    }
  }
}

run()