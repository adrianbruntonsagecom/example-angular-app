# Angular coding standards

This shows an example Angular application with a handful of basis components to demonstrate our coding standards. The purpose is to provide a small but complex enough application to sufficiently demonstrate the standards we expect to be met in a tangible way.

The most useful code to view is the current date component which calls a service to return the current date and time to display it on screen in the provided format with a button is refresh the data. The service mimics a real API call by adding a delay in the return value. Whilst this is in progress, a loading bar is displayed. This component is fully tested to demonstrate any expectations don't interfere with unit testing expectations (which are also part of our standards).

Code repository to demonstrate:

- Using standalone
- Readonly constructor parameters
- Readonly observables properties
- Use of async pipe
- Public accessibility for input and output decorators only
- Anything a template references is protected
- Everything else is private
- Child components are mocked using MockComponent - this allows for shallow rendering
- Expect detectChanges to be false
