import os
import subprocess
from git_filter_repo import FilterRepo

def main():
    def commit_callback(commit, metadata):
        new_email = b"greek.chen@huolala.cn"
        new_name = b"greek.chen"

        if commit.author_email != new_email:
            commit.author_name = new_name
            commit.author_email = new_email

        if commit.committer_email != new_email:
            commit.committer_name = new_name
            commit.committer_email = new_email

    repo = FilterRepo(repo_path=os.getcwd())
    repo.set_commit_callback(commit_callback)
    repo.run()

if __name__ == "__main__":
    main()